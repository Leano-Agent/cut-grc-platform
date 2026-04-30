import { Client } from 'ldapjs';
import { promisify } from 'util';
import logger from '../../config/logger';
import config from '../../config/config';

export interface ADUser {
  dn: string;
  sAMAccountName: string;
  userPrincipalName: string;
  mail: string;
  givenName: string;
  sn: string;
  displayName: string;
  title?: string;
  department?: string;
  company?: string;
  telephoneNumber?: string;
  mobile?: string;
  manager?: string;
  memberOf: string[];
  distinguishedName: string;
  whenCreated?: string;
  whenChanged?: string;
  lastLogon?: string;
  lastLogonTimestamp?: string;
  userAccountControl?: string;
  pwdLastSet?: string;
  lockoutTime?: string;
}

export interface ADGroup {
  dn: string;
  cn: string;
  name: string;
  description?: string;
  member: string[];
  distinguishedName: string;
  whenCreated?: string;
  whenChanged?: string;
}

export interface ADConfig {
  url: string;
  bindDN: string;
  bindCredentials: string;
  searchBase: string;
  searchFilter?: string;
  tlsOptions?: any;
  timeout?: number;
  connectTimeout?: number;
  idleTimeout?: number;
  reconnect?: boolean;
  strictDN?: boolean;
}

export interface ADSearchOptions {
  scope?: 'base' | 'one' | 'sub';
  filter: string;
  attributes?: string[];
  sizeLimit?: number;
  timeLimit?: number;
  paged?: boolean;
}

export class ActiveDirectoryService {
  private client: Client | null = null;
  private config: ADConfig;
  private isConnected: boolean = false;

  constructor(config: ADConfig) {
    this.config = {
      url: config.url,
      bindDN: config.bindDN,
      bindCredentials: config.bindCredentials,
      searchBase: config.searchBase,
      searchFilter: config.searchFilter || '(objectClass=user)',
      tlsOptions: config.tlsOptions || { rejectUnauthorized: false },
      timeout: config.timeout || 5000,
      connectTimeout: config.connectTimeout || 5000,
      idleTimeout: config.idleTimeout || 30000,
      reconnect: config.reconnect || true,
      strictDN: config.strictDN || true,
    };
  }

  /**
   * Connect to Active Directory
   */
  async connect(): Promise<boolean> {
    try {
      if (this.isConnected && this.client) {
        return true;
      }

      logger.info(`Connecting to Active Directory: ${this.config.url}`);
      
      this.client = Client.create({
        url: this.config.url,
        tlsOptions: this.config.tlsOptions,
        timeout: this.config.timeout,
        connectTimeout: this.config.connectTimeout,
        idleTimeout: this.config.idleTimeout,
        reconnect: this.config.reconnect,
      });

      // Bind to AD
      await promisify(this.client.bind).bind(this.client)(this.config.bindDN, this.config.bindCredentials);
      
      this.isConnected = true;
      logger.info('Successfully connected to Active Directory');
      
      return true;
    } catch (error: any) {
      logger.error('Failed to connect to Active Directory:', error);
      this.isConnected = false;
      this.client = null;
      throw new Error(`AD connection failed: ${error.message}`);
    }
  }

  /**
   * Disconnect from Active Directory
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await promisify(this.client.unbind).bind(this.client)();
        this.isConnected = false;
        this.client = null;
        logger.info('Disconnected from Active Directory');
      } catch (error: any) {
        logger.error('Error disconnecting from Active Directory:', error);
      }
    }
  }

  /**
   * Authenticate user against Active Directory
   */
  async authenticate(username: string, password: string): Promise<ADUser | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // First, search for the user
      const user = await this.findUserByUsername(username);
      if (!user) {
        logger.warn(`User not found in AD: ${username}`);
        return null;
      }

      // Try to bind with user's credentials
      const userClient = Client.create({
        url: this.config.url,
        tlsOptions: this.config.tlsOptions,
      });

      try {
        await promisify(userClient.bind).bind(userClient)(user.dn, password);
        
        // Authentication successful
        logger.info(`AD authentication successful for user: ${username}`);
        
        // Get full user details
        const fullUser = await this.getUserDetails(user.dn);
        await promisify(userClient.unbind).bind(userClient)();
        
        return fullUser;
      } catch (bindError: any) {
        logger.warn(`AD authentication failed for user: ${username}`, bindError);
        return null;
      }
    } catch (error: any) {
      logger.error('AD authentication error:', error);
      return null;
    }
  }

  /**
   * Find user by username (sAMAccountName)
   */
  async findUserByUsername(username: string): Promise<ADUser | null> {
    const filter = `(&(objectClass=user)(sAMAccountName=${username}))`;
    const users = await this.search<ADUser>(filter, [
      'dn',
      'sAMAccountName',
      'userPrincipalName',
      'mail',
      'givenName',
      'sn',
      'displayName',
      'title',
      'department',
      'company',
      'telephoneNumber',
      'mobile',
      'manager',
      'memberOf',
      'distinguishedName',
      'userAccountControl',
    ]);

    return users.length > 0 ? users[0] : null;
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<ADUser | null> {
    const filter = `(&(objectClass=user)(mail=${email}))`;
    const users = await this.search<ADUser>(filter, [
      'dn',
      'sAMAccountName',
      'userPrincipalName',
      'mail',
      'givenName',
      'sn',
      'displayName',
      'title',
      'department',
      'company',
      'telephoneNumber',
      'mobile',
      'manager',
      'memberOf',
      'distinguishedName',
      'userAccountControl',
    ]);

    return users.length > 0 ? users[0] : null;
  }

  /**
   * Get user details by DN
   */
  async getUserDetails(dn: string): Promise<ADUser | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const searchOptions = {
        scope: 'base' as const,
        filter: '(objectClass=user)',
        attributes: [
          'dn',
          'sAMAccountName',
          'userPrincipalName',
          'mail',
          'givenName',
          'sn',
          'displayName',
          'title',
          'department',
          'company',
          'telephoneNumber',
          'mobile',
          'manager',
          'memberOf',
          'distinguishedName',
          'whenCreated',
          'whenChanged',
          'lastLogon',
          'lastLogonTimestamp',
          'userAccountControl',
          'pwdLastSet',
          'lockoutTime',
        ],
      };

      const results: any[] = [];

      return new Promise((resolve, reject) => {
        const search = this.client!.search(dn, searchOptions, (error, res) => {
          if (error) {
            reject(error);
            return;
          }

          res.on('searchEntry', (entry) => {
            results.push(this.mapADEntryToUser(entry.object));
          });

          res.on('error', (err) => {
            reject(err);
          });

          res.on('end', () => {
            resolve(results.length > 0 ? results[0] : null);
          });
        });

        search.on('error', reject);
      });
    } catch (error: any) {
      logger.error('Error getting user details:', error);
      return null;
    }
  }

  /**
   * Get all users in an OU
   */
  async getUsersInOU(ouDN: string): Promise<ADUser[]> {
    const filter = '(objectClass=user)';
    return this.search<ADUser>(filter, [
      'dn',
      'sAMAccountName',
      'userPrincipalName',
      'mail',
      'givenName',
      'sn',
      'displayName',
      'title',
      'department',
      'company',
      'telephoneNumber',
      'mobile',
      'manager',
      'memberOf',
      'distinguishedName',
    ], ouDN);
  }

  /**
   * Get user groups
   */
  async getUserGroups(userDN: string): Promise<ADGroup[]> {
    const user = await this.getUserDetails(userDN);
    if (!user || !user.memberOf) {
      return [];
    }

    const groups: ADGroup[] = [];
    for (const groupDN of user.memberOf) {
      const group = await this.getGroupDetails(groupDN);
      if (group) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Get group details
   */
  async getGroupDetails(groupDN: string): Promise<ADGroup | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const searchOptions = {
        scope: 'base' as const,
        filter: '(objectClass=group)',
        attributes: [
          'dn',
          'cn',
          'name',
          'description',
          'member',
          'distinguishedName',
          'whenCreated',
          'whenChanged',
        ],
      };

      const results: any[] = [];

      return new Promise((resolve, reject) => {
        const search = this.client!.search(groupDN, searchOptions, (error, res) => {
          if (error) {
            reject(error);
            return;
          }

          res.on('searchEntry', (entry) => {
            results.push(this.mapADEntryToGroup(entry.object));
          });

          res.on('error', (err) => {
            reject(err);
          });

          res.on('end', () => {
            resolve(results.length > 0 ? results[0] : null);
          });
        });

        search.on('error', reject);
      });
    } catch (error: any) {
      logger.error('Error getting group details:', error);
      return null;
    }
  }

  /**
   * Search for groups
   */
  async searchGroups(filter: string = '(objectClass=group)', baseDN?: string): Promise<ADGroup[]> {
    return this.search<ADGroup>(filter, [
      'dn',
      'cn',
      'name',
      'description',
      'member',
      'distinguishedName',
    ], baseDN);
  }

  /**
   * Check if user is in group
   */
  async isUserInGroup(userDN: string, groupDN: string): Promise<boolean> {
    const user = await this.getUserDetails(userDN);
    if (!user || !user.memberOf) {
      return false;
    }

    return user.memberOf.some(group => group.toLowerCase() === groupDN.toLowerCase());
  }

  /**
   * Generic search method
   */
  private async search<T>(filter: string, attributes: string[], baseDN?: string): Promise<T[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const searchBase = baseDN || this.config.searchBase;
      const searchOptions = {
        scope: 'sub' as const,
        filter,
        attributes,
        sizeLimit: 1000,
      };

      const results: any[] = [];

      return new Promise((resolve, reject) => {
        const search = this.client!.search(searchBase, searchOptions, (error, res) => {
          if (error) {
            reject(error);
            return;
          }

          res.on('searchEntry', (entry) => {
            if (entry.object.objectClass?.includes('user')) {
              results.push(this.mapADEntryToUser(entry.object));
            } else if (entry.object.objectClass?.includes('group')) {
              results.push(this.mapADEntryToGroup(entry.object));
            } else {
              results.push(entry.object);
            }
          });

          res.on('error', (err) => {
            reject(err);
          });

          res.on('end', () => {
            resolve(results);
          });
        });

        search.on('error', reject);
      });
    } catch (error: any) {
      logger.error('AD search error:', error);
      return [];
    }
  }

  /**
   * Map AD entry to user object
   */
  private mapADEntryToUser(entry: any): ADUser {
    return {
      dn: entry.dn,
      sAMAccountName: entry.sAMAccountName?.[0] || '',
      userPrincipalName: entry.userPrincipalName?.[0] || '',
      mail: entry.mail?.[0] || '',
      givenName: entry.givenName?.[0] || '',
      sn: entry.sn?.[0] || '',
      displayName: entry.displayName?.[0] || '',
      title: entry.title?.[0],
      department: entry.department?.[0],
      company: entry.company?.[0],
      telephoneNumber: entry.telephoneNumber?.[0],
      mobile: entry.mobile?.[0],
      manager: entry.manager?.[0],
      memberOf: entry.memberOf || [],
      distinguishedName: entry.distinguishedName?.[0] || entry.dn,
      whenCreated: entry.whenCreated?.[0],
      whenChanged: entry.whenChanged?.[0],
      lastLogon: entry.lastLogon?.[0],
      lastLogonTimestamp: entry.lastLogonTimestamp?.[0],
      userAccountControl: entry.userAccountControl?.[0],
      pwdLastSet: entry.pwdLastSet?.[0],
      lockoutTime: entry.lockoutTime?.[0],
    };
  }

  /**
   * Map AD entry to group object
   */
  private mapADEntryToGroup(entry: any): ADGroup {
    return {
      dn: entry.dn,
      cn: entry.cn?.[0] || '',
      name: entry.name?.[0] || '',
      description: entry.description?.[0],
      member: entry.member || [],
      distinguishedName: entry.distinguishedName?.[0] || entry.dn,
      whenCreated: entry.whenCreated?.[0],
      whenChanged: entry.whenChanged?.[0],
    };
  }

  /**
   * Check if user account is active (not disabled)
   */
  isUserAccountActive(userAccountControl: string): boolean {
    if (!userAccountControl) return true;
    
    const uac = parseInt(userAccountControl, 10);
    // Check if ADS_UF_ACCOUNTDISABLE flag is not set (0x0002)
    return (uac & 0x0002) === 0;
  }

  /**
   * Check if user account is locked
   */
  isUserAccountLocked(lockoutTime: string): boolean {
    if (!lockoutTime) return false;
    
    const lockout = parseInt(lockoutTime, 10);
    // If lockoutTime is 0, account is not locked
    // If lockoutTime is > 0, check if it's within lockout duration
    if (lockout === 0) return false;
    
    // Convert AD timestamp (100-nanosecond intervals since Jan 1, 1601)
    // to milliseconds and check if it's recent
    const lockoutDate = new Date((lockout / 10000) - 11644473600000);
    const lockoutDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
    const now = new Date();
    
    return (now.getTime() - lockoutDate.getTime()) < lockoutDuration;
  }

  /**
   * Get OU structure
   */
  async getOUStructure(ouDN?: string): Promise<any[]> {
    const filter = '(objectClass=organizationalUnit)';
    const ous = await this.search<any>(filter, [
      'dn',
      'ou',
      'name',
      'description',
      'distinguishedName',
    ], ouDN);

    return ous.map(ou => ({
      dn: ou.dn,
      name: ou.ou?.[0] || ou.name?.[0] || '',
      description: ou.description?.[0],
      distinguishedName: ou.distinguishedName || ou.dn,
    }));
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      // Try a simple search to verify connection
      const searchOptions = {
        scope: 'base' as const,
        filter: '(objectClass=*)',
        attributes: ['namingContexts'],
      };

      return new Promise((resolve) => {
        const search = this.client!.search('', searchOptions, (error, res) => {
          if (error) {
            resolve(false);
            return;
          }

          res.on('searchEntry', () => {
            resolve(true);
          });

          res.on('error', () => {
            resolve(false);
          });

          res.on('end', () => {
            // If we get here without entries, still consider it healthy
            resolve(true);
          });
        });

        search.on('error', () => resolve(false));
      });
    } catch (error: any) {
      logger.error('AD health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let adServiceInstance: ActiveDirectoryService | null = null;

export function getADService(): ActiveDirectoryService {
  if (!adServiceInstance) {
    const adConfig: ADConfig = {
      url: config.ad?.url || 'ldap://localhost:389',
      bindDN: config.ad?.bindDN || '',
      bindCredentials: config.ad?.bindCredentials || '',
      searchBase: config.ad?.searchBase || 'dc=domain,dc=com',
      searchFilter: config.ad?.searchFilter,
      tlsOptions: config.ad?.tlsOptions || { rejectUnauthorized: false },
      timeout: config.ad?.timeout
    }
  }
}
