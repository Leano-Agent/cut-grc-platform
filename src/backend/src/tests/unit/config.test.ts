import config from '../../config/config';

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Environment validation', () => {
    it('should load with default values when no env vars are set', () => {
      // Clear environment variables
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.DB_NAME;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      // Import config fresh to pick up cleared env
      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        
        expect(freshConfig.env).toBe('development');
        expect(freshConfig.port).toBe(3000);
        expect(freshConfig.isDevelopment).toBe(true);
        expect(freshConfig.isProduction).toBe(false);
        expect(freshConfig.isTest).toBe(false);
      });
    });

    it('should throw error when required env vars are missing', () => {
      // Clear required environment variables
      delete process.env.DB_NAME;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      expect(() => {
        jest.isolateModules(() => {
          require('../../config/config');
        });
      }).toThrow();
    });

    it('should load test environment correctly', () => {
      process.env.NODE_ENV = 'test';
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        
        expect(freshConfig.env).toBe('test');
        expect(freshConfig.isTest).toBe(true);
        expect(freshConfig.isDevelopment).toBe(false);
        expect(freshConfig.isProduction).toBe(false);
      });
    });

    it('should load production environment correctly', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_NAME = 'prod_db';
      process.env.DB_USER = 'prod_user';
      process.env.DB_PASSWORD = 'prod_password';
      process.env.JWT_SECRET = 'prod-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'prod-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        
        expect(freshConfig.env).toBe('production');
        expect(freshConfig.isProduction).toBe(true);
        expect(freshConfig.isDevelopment).toBe(false);
        expect(freshConfig.isTest).toBe(false);
      });
    });
  });

  describe('Database configuration', () => {
    it('should parse database configuration correctly', () => {
      process.env.DB_HOST = 'test-host';
      process.env.DB_PORT = '5433';
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.DB_SSL = 'true';
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        
        expect(freshConfig.database.host).toBe('test-host');
        expect(freshConfig.database.port).toBe(5433);
        expect(freshConfig.database.name).toBe('test_db');
        expect(freshConfig.database.user).toBe('test_user');
        expect(freshConfig.database.password).toBe('test_password');
        expect(freshConfig.database.ssl).toBe(true);
        expect(freshConfig.database.pool.max).toBe(20);
        expect(freshConfig.database.pool.min).toBe(5);
      });
    });

    it('should use default database SSL setting', () => {
      delete process.env.DB_SSL;
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        expect(freshConfig.database.ssl).toBe(false);
      });
    });
  });

  describe('Redis configuration', () => {
    it('should parse Redis configuration correctly', () => {
      process.env.REDIS_HOST = 'redis-host';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'redis-password';
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        
        expect(freshConfig.redis.host).toBe('redis-host');
        expect(freshConfig.redis.port).toBe(6380);
        expect(freshConfig.redis.password).toBe('redis-password');
        expect(freshConfig.redis.keyPrefix).toBe('cut-grc:');
      });
    });

    it('should use default Redis values', () => {
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
      delete process.env.REDIS_PASSWORD;
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        
        expect(freshConfig.redis.host).toBe('localhost');
        expect(freshConfig.redis.port).toBe(6379);
        expect(freshConfig.redis.password).toBeUndefined();
      });
    });
  });

  describe('JWT configuration', () => {
    it('should parse JWT configuration correctly', () => {
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_EXPIRES_IN = '2h';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';
      process.env.JWT_REFRESH_EXPIRES_IN = '14d';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        
        expect(freshConfig.jwt.secret).toBe('test-jwt-secret-32-chars-long-here');
        expect(freshConfig.jwt.expiresIn).toBe('2h');
        expect(freshConfig.jwt.refreshSecret).toBe('test-refresh-secret-32-chars-long-here');
        expect(freshConfig.jwt.refreshExpiresIn).toBe('14d');
      });
    });

    it('should use default JWT expiry values', () => {
      delete process.env.JWT_EXPIRES_IN;
      delete process.env.JWT_REFRESH_EXPIRES_IN;
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        
        expect(freshConfig.jwt.expiresIn).toBe('24h');
        expect(freshConfig.jwt.refreshExpiresIn).toBe('7d');
      });
    });
  });

  describe('CORS configuration', () => {
    it('should parse CORS origin correctly', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000';
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        expect(freshConfig.corsOrigin).toBe('http://localhost:3000');
      });
    });

    it('should use default CORS origin', () => {
      delete process.env.CORS_ORIGIN;
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        expect(freshConfig.corsOrigin).toBe('http://localhost:5173');
      });
    });
  });

  describe('Email configuration', () => {
    it('should parse email configuration correctly', () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'test@test.com';
      process.env.SMTP_PASSWORD = 'test-password';
      process.env.EMAIL_FROM = 'noreply@test.com';
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        
        expect(freshConfig.email.host).toBe('smtp.test.com');
        expect(freshConfig.email.port).toBe(587);
        expect(freshConfig.email.user).toBe('test@test.com');
        expect(freshConfig.email.password).toBe('test-password');
        expect(freshConfig.email.from).toBe('noreply@test.com');
      });
    });

    it('should use default email from address', () => {
      delete process.env.EMAIL_FROM;
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        expect(freshConfig.email.from).toBe('noreply@cut.ac.za');
      });
    });
  });

  describe('AWS configuration', () => {
    it('should parse AWS configuration correctly', () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
      process.env.AWS_REGION = 'us-west-2';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        
        expect(freshConfig.aws.accessKeyId).toBe('test-access-key');
        expect(freshConfig.aws.secretAccessKey).toBe('test-secret-key');
        expect(freshConfig.aws.region).toBe('us-west-2');
        expect(freshConfig.aws.s3Bucket).toBe('test-bucket');
      });
    });

    it('should use default AWS region', () => {
      delete process.env.AWS_REGION;
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        expect(freshConfig.aws.region).toBe('af-south-1');
      });
    });
  });

  describe('Logging configuration', () => {
    it('should parse log level correctly', () => {
      process.env.LOG_LEVEL = 'debug';
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        expect(freshConfig.logLevel).toBe('debug');
      });
    });

    it('should use default log level', () => {
      delete process.env.LOG_LEVEL;
      process.env.JWT_SECRET = 'test-jwt-secret-32-chars-long-here';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long-here';

      jest.isolateModules(() => {
        const freshConfig = require('../../config/config').default;
        expect(freshConfig.logLevel).toBe('info');
      });
    });
  });

  describe('Rate limiting configuration', () => {
    it('should have correct rate limiting defaults', () => {
      expect(config.rateLimit.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(config.rateLimit.max).toBe(100);
    });
  });

  describe('Upload configuration', () => {
    it('should have correct upload limits', () => {
      expect(config.upload.maxFileSize).toBe(10 * 1024 * 1024); // 10MB
      expect(config.upload.allowedFileTypes).toContain('image/jpeg');
      expect(config.upload.allowedFileTypes).toContain('application/pdf');
      expect(config.upload.allowedFileTypes).toHaveLength(8);
    });
  });

  describe('Pagination configuration', () => {
    it('should have correct pagination defaults', () => {
      expect(config.pagination.defaultLimit).toBe(20);
      expect(config.pagination.maxLimit).toBe(100);
    });
  });

  describe('Socket.IO configuration', () => {
    it('should have correct Socket.IO defaults', () => {
      expect(config.socketIO.pingInterval).toBe(25000);
      expect(config.socketIO.pingTimeout).toBe(60000);
    });
  });
});