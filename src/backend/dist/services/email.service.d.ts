declare class EmailService {
    private transporter;
    private initialized;
    constructor();
    private initialize;
    sendMail(options: {
        to: string | string[];
        subject: string;
        html: string;
        text?: string;
        from?: string;
    }): Promise<boolean>;
    sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean>;
    sendWelcomeEmail(to: string, firstName: string): Promise<boolean>;
}
export declare const emailService: EmailService;
export default EmailService;
//# sourceMappingURL=email.service.d.ts.map