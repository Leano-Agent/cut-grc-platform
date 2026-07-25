import { z } from 'zod';
export declare const ADConfigSchema: any;
export type ADConfig = z.infer<typeof ADConfigSchema>;
export declare const defaultADConfig: ADConfig;
export declare const ADEnvSchema: any;
export type ADEnv = z.infer<typeof ADEnvSchema>;
export declare function loadADConfigFromEnv(env: NodeJS.ProcessEnv): ADConfig;
export declare function validateADConfig(config: Partial<ADConfig>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
export declare function getSafeADConfig(config: ADConfig): Partial<ADConfig>;
export declare function saveADConfigToFile(config: ADConfig, filePath: string): Promise<boolean>;
export declare function loadADConfigFromFile(filePath: string): Promise<ADConfig | null>;
export declare function generateADEnvFile(config: ADConfig): string;
//# sourceMappingURL=ad.config.d.ts.map