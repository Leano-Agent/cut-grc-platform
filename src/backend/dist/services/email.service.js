"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config/config"));
const logger_1 = __importDefault(require("../config/logger"));
class EmailService {
    transporter = null;
    initialized = false;
    constructor() {
        this.initialize();
    }
    initialize() {
        if (!config_1.default.email?.host) {
            logger_1.default.warn('Email service not configured — SMTP_HOST not set. Emails will be logged only.');
            return;
        }
        try {
            this.transporter = nodemailer_1.default.createTransport({
                host: config_1.default.email.host,
                port: config_1.default.email.port || 587,
                secure: config_1.default.email.port === 465,
                auth: {
                    user: config_1.default.email.user,
                    pass: config_1.default.email.password,
                },
            });
            this.initialized = true;
            logger_1.default.info('Email service initialized', { host: config_1.default.email.host });
        }
        catch (error) {
            logger_1.default.error('Failed to initialize email service', { error });
        }
    }
    async sendMail(options) {
        if (!this.initialized || !this.transporter) {
            logger_1.default.info('Email not sent (service not configured)', {
                to: options.to,
                subject: options.subject,
            });
            return false;
        }
        try {
            const info = await this.transporter.sendMail({
                from: options.from || config_1.default.email.from || 'noreply@cut.ac.za',
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                text: options.text || '',
                html: options.html,
            });
            logger_1.default.info('Email sent successfully', {
                messageId: info.messageId,
                to: options.to,
                subject: options.subject,
            });
            return true;
        }
        catch (error) {
            logger_1.default.error('Failed to send email', {
                to: options.to,
                subject: options.subject,
                error,
            });
            return false;
        }
    }
    async sendPasswordResetEmail(to, resetToken) {
        const resetUrl = `${config_1.default.corsOrigin || 'https://ngome-frontend.vercel.app'}/reset-password?token=${resetToken}`;
        return this.sendMail({
            to,
            subject: 'Ngome Platform — Password Reset',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a5276; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Ngome Platform</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #1a5276; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 4px; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p>If you did not request this, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
            <hr style="border: none; border-top: 1px solid #ddd;" />
            <p style="font-size: 12px; color: #666;">
              Central University of Technology — Governance, Risk & Compliance Platform
            </p>
          </div>
        </div>
      `,
            text: `Password Reset Request\n\nYou have requested to reset your password. Visit: ${resetUrl}\n\nThis link will expire in 1 hour.`,
        });
    }
    async sendWelcomeEmail(to, firstName) {
        return this.sendMail({
            to,
            subject: 'Welcome to Ngome Platform',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a5276; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Ngome Platform</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Welcome, ${firstName}!</h2>
            <p>Your account has been created on the Ngome Governance, Risk & Compliance Platform.</p>
            <p>You can now log in and access the platform's features.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${config_1.default.corsOrigin || 'https://ngome-frontend.vercel.app'}/login" 
                 style="background-color: #1a5276; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 4px; font-size: 16px;">
                Log in to Platform
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd;" />
            <p style="font-size: 12px; color: #666;">
              Central University of Technology — Governance, Risk & Compliance Platform
            </p>
          </div>
        </div>
      `,
            text: `Welcome to Ngome Platform, ${firstName}!\n\nYour account has been created. Log in at: ${config_1.default.corsOrigin || 'https://ngome-frontend.vercel.app'}/login`,
        });
    }
}
exports.emailService = new EmailService();
exports.default = EmailService;
//# sourceMappingURL=email.service.js.map