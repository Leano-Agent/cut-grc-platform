import { DataTypes, Model, Optional } from 'sequelize';
import database from '../config/database';

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

type OrganisationCreationAttributes = Optional<
  OrganisationAttributes,
  'id' | 'domain' | 'logoUrl' | 'primaryColor' | 'isActive' | 'subscriptionTier' | 'maxUsers' | 'settings' | 'createdAt' | 'updatedAt'
>;

class Organisation extends Model<OrganisationAttributes, OrganisationCreationAttributes> implements OrganisationAttributes {
  declare id: string;
  declare name: string;
  declare slug: string;
  declare domain: string | null;
  declare logoUrl: string | null;
  declare primaryColor: string | null;
  declare isActive: boolean;
  declare subscriptionTier: 'free' | 'starter' | 'professional' | 'enterprise';
  declare maxUsers: number;
  declare settings: Record<string, unknown>;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Organisation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    logoUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'logo_url',
    },
    primaryColor: {
      type: DataTypes.STRING(7),
      allowNull: true,
      field: 'primary_color',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    subscriptionTier: {
      type: DataTypes.ENUM('free', 'starter', 'professional', 'enterprise'),
      allowNull: false,
      defaultValue: 'free',
      field: 'subscription_tier',
    },
    maxUsers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      field: 'max_users',
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize: database.getSequelize(),
    modelName: 'Organisation',
    tableName: 'organisations',
    timestamps: true,
    underscored: true,
  }
);

export default Organisation;
export { OrganisationAttributes, OrganisationCreationAttributes };
