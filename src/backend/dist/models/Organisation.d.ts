import { Model, Optional } from 'sequelize';
interface OrganisationAttributes {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
    isActive: boolean;
    subscriptionTier: 'free' | 'starter' | 'professional' | 'enterprise';
    maxUsers: number;
    settings: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
type OrganisationCreationAttributes = Optional<OrganisationAttributes, 'id' | 'domain' | 'logoUrl' | 'primaryColor' | 'isActive' | 'subscriptionTier' | 'maxUsers' | 'settings' | 'createdAt' | 'updatedAt'>;
declare class Organisation extends Model<OrganisationAttributes, OrganisationCreationAttributes> implements OrganisationAttributes {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
    isActive: boolean;
    subscriptionTier: 'free' | 'starter' | 'professional' | 'enterprise';
    maxUsers: number;
    settings: Record<string, unknown>;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default Organisation;
export { OrganisationAttributes, OrganisationCreationAttributes };
//# sourceMappingURL=Organisation.d.ts.map