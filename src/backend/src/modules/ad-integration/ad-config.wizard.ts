import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import logger from '../../config/logger';
import config from '../../config/config';
import { ActiveDirectoryService, ADConfig } from './ad.service';

export interface ADWizardStep {
  id: string;
  title: string;
  description: string;
  fields: WizardField[];
  validationSchema: z.ZodSchema;
  nextStep?: string;
  previousStep?: string;
}

export interface WizardField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'checkbox' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  options?: { label: string; value: string }[];
  secure?: boolean;
}

export interface WizardState {
  currentStep: string;
  completedSteps: string[];
  data: Record<string, any>;
  errors: Record<string, string[]>;
  isValid: boolean;
}

export interface WizardResult {
  success: boolean;
  config: ADConfig;
  errors: string[];
  warnings: string[];
  testResults: {
    connection: boolean;
    authentication: boolean;
    search: boolean;
    userCount: number;
  };
}

export class ADConfigWizard {
  private steps: ADWizardStep[];
  private state: WizardState;
  private adService: ActiveDirectoryService | null = null;

  constructor() {
    this.steps = this.createSteps();
    this.state = this.initializeState();
  }

  /**
   * Create wizard steps
   */
  private createSteps(): ADWizardStep[] {
    return [
      {
        id: 'welcome',
        title: 'Active Directory Integration Setup',
        description: 'This wizard will guide you through configuring Active Directory integration for your GRC system. You will need your AD server details and service account credentials.',
        fields: [],
        validationSchema: z.object({}),
        nextStep: 'connection',
      },
      {
        id: 'connection',
        title: 'AD Server Connection',
        description: 'Enter your Active Directory server connection details.',
        fields: [
          {
            id: 'url',
            label: 'AD Server URL',
            type: 'url',
            required: true,
            placeholder: 'ldap://ad-server.domain.com:389 or ldaps://ad-server.domain.com:636',
            helpText: 'Use ldap:// for unencrypted or ldaps:// for SSL/TLS encrypted connections',
            defaultValue: 'ldap://localhost:389',
          },
          {
            id: 'tlsEnabled',
            label: 'Enable TLS/SSL',
            type: 'checkbox',
            required: false,
            helpText: 'Check if your AD server requires TLS/SSL encryption',
            defaultValue: false,
          },
          {
            id: 'tlsOptions',
            label: 'TLS Options',
            type: 'textarea',
            required: false,
            placeholder: '{"rejectUnauthorized": false}',
            helpText: 'Advanced TLS options in JSON format. Leave empty for default settings.',
            defaultValue: '{"rejectUnauthorized": false}',
          },
        ],
        validationSchema: z.object({
          url: z.string().url('Valid URL required').refine(url => url.startsWith('ldap://') || url.startsWith('ldaps://'), {
            message: 'URL must start with ldap:// or ldaps://',
          }),
          tlsEnabled: z.boolean().optional(),
          tlsOptions: z.string().optional(),
        }),
        nextStep: 'authentication',
        previousStep: 'welcome',
      },
      {
        id: 'authentication',
        title: 'Service Account Authentication',
        description: 'Enter the service account credentials used to query Active Directory.',
        fields: [
          {
            id: 'bindDN',
            label: 'Bind DN (Distinguished Name)',
            type: 'text',
            required: true,
            placeholder: 'CN=ServiceAccount,OU=ServiceAccounts,DC=domain,DC=com',
            helpText: 'The full distinguished name of the service account',
          },
          {
            id: 'bindCredentials',
            label: 'Bind Password',
            type: 'password',
            required: true,
            placeholder: 'Service account password',
            helpText: 'Password for the service account',
            secure: true,
          },
          {
            id: 'searchBase',
            label: 'Search Base DN',
            type: 'text',
            required: true,
            placeholder: 'DC=domain,DC=com',
            helpText: 'The base DN where user searches will start',
            defaultValue: 'DC=domain,DC=com',
          },
        ],
        validationSchema: z.object({
          bindDN: z.string().min(1, 'Bind DN is required'),
          bindCredentials: z.string().min(1, 'Bind password is required'),
          searchBase: z.string().min(1, 'Search base is required'),
        }),
        nextStep: 'search',
        previousStep: 'connection',
      },
      {
        id: 'search',
        title: 'Search Configuration',
        description: 'Configure how users and groups are searched in Active Directory.',
        fields: [
          {
            id: 'searchFilter',
            label: 'User Search Filter',
            type: 'text',
            required: false,
            placeholder: '(objectClass=user)',
            helpText: 'LDAP filter for searching users. Default: (objectClass=user)',
            defaultValue: '(objectClass=user)',
          },
          {
            id: 'usernameAttribute',
            label: 'Username Attribute',
            type: 'text',
            required: false,
            placeholder: 'sAMAccountName',
            helpText: 'AD attribute that contains the username. Default: sAMAccountName',
            defaultValue: 'sAMAccountName',
          },
          {
            id: 'emailAttribute',
            label: 'Email Attribute',
            type: 'text',
            required: false,
            placeholder: 'mail',
            helpText: 'AD attribute that contains the email. Default: mail',
            defaultValue: 'mail',
          },
          {
            id: 'groupSearchFilter',
            label: 'Group Search Filter',
            type: 'text',
            required: false,
            placeholder: '(objectClass=group)',
            helpText: 'LDAP filter for searching groups. Default: (objectClass=group)',
            defaultValue: '(objectClass=group)',
          },
        ],
        validationSchema: z.object({
          searchFilter: z.string().optional(),
          usernameAttribute: z.string().optional(),
          emailAttribute: z.string().optional(),
          groupSearchFilter: z.string().optional(),
        }),
        nextStep: 'mapping',
        previousStep: 'authentication',
      },
      {
        id: 'mapping',
        title: 'Role and Department Mapping',
        description: 'Map AD groups to GRC roles and configure department synchronization.',
        fields: [
          {
            id: 'roleMappings',
            label: 'Role Mappings',
            type: 'textarea',
            required: false,
            placeholder: '{\n  "GRC_Admins": "admin",\n  "GRC_Managers": "manager",\n  "GRC_Auditors": "auditor"\n}',
            helpText: 'JSON mapping of AD group names to GRC roles',
            defaultValue: '{\n  "GRC_Admins": "admin",\n  "GRC_Managers": "manager",\n  "GRC_Auditors": "auditor",\n  "Domain Admins": "admin"\n}',
          },
          {
            id: 'syncDepartments',
            label: 'Synchronize Departments',
            type: 'checkbox',
            required: false,
            helpText: 'Automatically create departments from AD organizational units',
            defaultValue: true,
          },
          {
            id: 'departmentAttribute',
            label: 'Department Attribute',
            type: 'text',
            required: false,
            placeholder: 'department',
            helpText: 'AD attribute that contains department information',
            defaultValue: 'department',
          },
          {
            id: 'autoSyncEnabled',
            label: 'Enable Automatic Synchronization',
            type: 'checkbox',
            required: false,
            helpText: 'Automatically sync users from AD on a schedule',
            defaultValue: true,
          },
          {
            id: 'autoSyncSchedule',
            label: 'Sync Schedule (Cron)',
            type: 'text',
            required: false,
            placeholder: '0 2 * * *',
            helpText: 'Cron expression for automatic sync (daily at 2 AM by default)',
            defaultValue: '0 2 * * *',
          },
        ],
        validationSchema: z.object({
          roleMappings: z.string().optional(),
          syncDepartments: z.boolean().optional(),
          departmentAttribute: z.string().optional(),
          autoSyncEnabled: z.boolean().optional(),
          autoSyncSchedule: z.string().optional(),
        }),
        nextStep: 'test',
        previousStep: 'search',
      },
      {
        id: 'test',
        title: 'Test Configuration',
        description: 'Test your AD configuration before saving.',
        fields: [
          {
            id: 'testUsername',
            label: 'Test Username',
            type: 'text',
            required: false,
            placeholder: 'jdoe',
            helpText: 'Optional: Test authentication with a specific user',
          },
          {
            id: 'testPassword',
            label: 'Test Password',
            type: 'password',
            required: false,
            placeholder: 'User password',
            helpText: 'Password for the test user',
            secure: true,
          },
          {
            id: 'testSearch',
            label: 'Test Search Query',
            type: 'text',
            required: false,
            placeholder: 'john',
            helpText: 'Optional: Test user search with this query',
          },
        ],
        validationSchema: z.object({
          testUsername: z.string().optional(),
          testPassword: z.string().optional(),
          testSearch: z.string().optional(),
        }),
        nextStep: 'summary',
        previousStep: 'mapping',
      },
      {
        id: 'summary',
        title: 'Configuration Summary',
        description: 'Review your configuration before saving.',
        fields: [],
        validationSchema: z.object({}),
        previousStep: 'test',
      },
    ];
  }

  /**
   * Initialize wizard state
   */
  private initializeState(): WizardState {
    // Load existing config if available
    const existingConfig = config.ad || {};
    
    return {
      currentStep: 'welcome',
      completedSteps: [],
      data: {
        url: existingConfig.url || 'ldap://localhost:389',
        tlsEnabled: existingConfig.tlsEnabled || false,
        bindDN: existingConfig.bindDN || '',
        searchBase: existingConfig.searchBase || 'DC=domain,DC=com',
        searchFilter: existingConfig.searchFilter || '(objectClass=user)',
        enabled: existingConfig.enabled || false,
      },
      errors: {},
      isValid: false,
    };
  }

  /**
   * Get current step
   */
  getCurrentStep(): ADWizardStep {
    const step = this.steps.find(s => s.id === this.state.currentStep);
    if (!step) {
      throw new Error(`Step not found: ${this.state.currentStep}`);
    }
    return step;
  }

  /**
   * Get wizard state
   */
  getState(): WizardState {
    return { ...this.state };
  }

  /**
   * Navigate to step
   */
  goToStep(stepId: string): boolean {
    const step = this.steps.find(s => s.id === stepId);
    if (!step) {
      logger.error(`Step not found: ${stepId}`);
      return false;
    }

    this.state.currentStep = stepId;
    
    // Mark previous steps as completed
    if (!this.state.completedSteps.includes(stepId)) {
      this.state.completedSteps.push(stepId);
    }

    logger.debug(`Navigated to step: ${stepId}`);
    return true;
  }

  /**
   * Go to next step
   */
  nextStep(): boolean {
    const currentStep = this.getCurrentStep();
    if (!currentStep.nextStep) {
      return false;
    }
    return this.goToStep(currentStep.nextStep);
  }

  /**
   * Go to previous step
   */
  previousStep(): boolean {
    const currentStep = this.getCurrentStep();
    if (!currentStep.previousStep) {
      return false;
    }
    return this.goToStep(currentStep.previousStep);
  }

  /**
   * Update step data
   */
  updateStepData(stepId: string, data: Record<string, any>): boolean {
    try {
      const step = this.steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error(`Step not found: ${stepId}`);
      }

      // Validate data
      const validationResult = step.validationSchema.safeParse(data);
      if (!validationResult.success) {
        this.state.errors[stepId] = validationResult.error.errors.map(err => err.message);
        this.state.isValid = false;
        return false;
      }

      // Update data
      this.state.data = {
        ...this.state.data,
        ...validationResult.data,
      };

      // Clear errors for this step
      delete this.state.errors[stepId];

      // Check if all steps are valid
      this.state.isValid = this.validateAllSteps();

      logger.debug(`Updated data for step: ${stepId}`);
      return true;
    } catch (error: any) {
      logger.error(`Error updating step data: ${error.message}`);
      this.state.errors[stepId] = [error.message];
      return false;
    }
  }

  /**
   * Validate all steps
   */
  private validateAllSteps(): boolean {
    for (const step of this.steps) {
      if (step.fields.length === 0) continue;

      const stepData = this.getStepData(step.id);
      const validationResult = step.validationSchema.safeParse(stepData);
      
      if (!validationResult.success) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get data for a specific step
   */
  private getStepData(stepId: string): Record<string, any> {
    const step = this.steps.find(s => s.id === stepId);
    if (!step) return {};

    const stepData: Record<string, any> = {};
    for (const field of step.fields) {
      if (this.state.data[field.id] !== undefined) {
        stepData[field.id] = this.state.data[field.id];
      } else if (field.defaultValue !== undefined) {
        stepData[field.id] = field.defaultValue;
      }
    }

    return stepData;
  }

  /**
   * Test AD configuration
   */
  async testConfiguration(): Promise<WizardResult> {
    const result: WizardResult = {
      success: false,
      config: this.getADConfig(),
      errors: [],
      warnings: [],
      testResults: {
        connection: false,
        authentication: false,
        search: false,
        userCount: 0,
      },
    };

    try {
      // Create AD service with test config
      this.adService = new ActiveDirectoryService(result.config);

      // Test connection
      logger.info('Testing AD connection...');
      result.testResults.connection = await this.adService.connect();
      
      if (!result.testResults.connection) {
        result.errors.push('Failed to connect to AD server');
        return result;
      }

      // Test authentication (already done by connect())
      result.testResults.authentication = true;

      // Test search
      logger.info('Testing AD search...');
      const users = await this.adService.search<any>('(objectClass=user)', ['sAMAccountName']);
      result.testResults.search = users.length > 0;
      result.testResults.userCount = users.length;

      if (!result.testResults.search) {
        result.warnings.push('No users found in AD search. Check your search base and filter.');
      }

      // Test specific user authentication if provided
      const testUsername = this.state.data.testUsername;
      const testPassword = this.state.data.testPassword;
      
      if (testUsername && testPassword) {
        logger.info(`Testing user authentication for: ${testUsername}`);
        const user = await this.adService.authenticate(testUsername, testPassword);
        if (user) {
          result.warnings.push(`User authentication successful for: ${testUsername}`);
        } else {
          result.warnings.push(`User authentication failed for: ${testUsername}. Check user credentials and account status.`);
        }
      }

      // Test search query if provided
      const testSearch = this.state.data.testSearch;
      if (testSearch) {
        const filter = `(&(objectClass=user)(|(sAMAccountName=*${testSearch}*)(displayName=*${testSearch}*)(mail=*${testSearch}*)))`;
        const searchResults = await this.adService.search<any>(filter, ['sAMAccountName', 'displayName', 'mail']);
        result.warnings.push(`Search test found ${searchResults.length} users matching "${testSearch}"`);
      }

      result.success = result.testResults.connection && result.testResults.authentication;
      
      // Disconnect
      await this.adService.disconnect();

      return result;
    } catch (error: any) {
      logger.error('AD configuration test failed:', error);
      result.errors.push(`Configuration test failed: ${error.message}`);
      
      // Try to disconnect if service was created
      if (this.adService) {
        try {
          await this.adService.disconnect();
        } catch (disconnectError) {
          // Ignore disconnect errors
        }
      }
      
      return result;
    }
  }

  /**
   * Get AD configuration from wizard data
   */
  private getADConfig(): ADConfig {
    // Parse TLS options
    let tlsOptions = { rejectUnauthorized: false };
    try {
      if (this.state.data.tlsOptions) {
        tlsOptions = JSON.parse(this.state.data.tlsOptions);
      }
    } catch (error) {
      logger.warn('Failed to parse TLS options, using defaults');
    }

    // Parse role mappings
    let roleMappings = {};
    try {
      if (this.state.data.roleMappings) {
        roleMappings = JSON.parse(this.state.data.roleMappings);
      }
    } catch (error) {
      logger.warn('Failed to parse role mappings');
    }


      }
    }
  }
}
