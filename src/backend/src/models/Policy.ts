import { DataTypes, Model, Optional } from 'sequelize';
import database from '../config/database';

interface PolicyAttributes {
  id: string;
  title: string;
  description: string | null;
  category: 'information_security' | 'data_privacy' | 'acceptable_use' | 'access_control' | 'business_continuity' | 'incident_response' | 'hr' | 'financial' | 'compliance' | 'it_governance' | 'other';
  status: 'draft' | 'under_review' | 'approved' | 'published' | 'expired' | 'archived';
  version: string;
  content: string | null;
  scope: string | null;
  department: string | null;
  ownerId: string | null;
  approverId: string | null;
  effectiveDate: Date | null;
  reviewDate: Date | null;
  expiryDate: Date | null;
  tags: string[] | null;
  attachments: string[] | null;
  regulatoryReferences: string[] | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  organisationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type PolicyCreationAttributes = Optional<
  PolicyAttributes,
  'id' | 'description' | 'category' | 'status' | 'version' | 'content' | 'scope' | 'department' | 'ownerId' | 'approverId' | 'effectiveDate' | 'reviewDate' | 'expiryDate' | 'tags' | 'attachments' | 'regulatoryReferences' | 'metadata' | 'createdBy' | 'organisationId' | 'createdAt' | 'updatedAt'
>;

class Policy extends Model<PolicyAttributes, PolicyCreationAttributes> implements PolicyAttributes {
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare category: 'information_security' | 'data_privacy' | 'acceptable_use' | 'access_control' | 'business_continuity' | 'incident_response' | 'hr' | 'financial' | 'compliance' | 'it_governance' | 'other';
  declare status: 'draft' | 'under_review' | 'approved' | 'published' | 'expired' | 'archived';
  declare version: string;
  declare content: string | null;
  declare scope: string | null;
  declare department: string | null;
  declare ownerId: string | null;
  declare approverId: string | null;
  declare effectiveDate: Date | null;
  declare reviewDate: Date | null;
  declare expiryDate: Date | null;
  declare tags: string[] | null;
  declare attachments: string[] | null;
  declare regulatoryReferences: string[] | null;
  declare metadata: Record<string, unknown>;
  declare createdBy: string | null;
  declare organisationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Policy.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Policy title is required' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM(
        'information_security', 'data_privacy', 'acceptable_use',
        'access_control', 'business_continuity', 'incident_response',
        'hr', 'financial', 'compliance', 'it_governance', 'other'
      ),
      allowNull: false,
      defaultValue: 'other',
    },
    status: {
      type: DataTypes.ENUM('draft', 'under_review', 'approved', 'published', 'expired', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '1.0.0',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    scope: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'owner_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approverId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'approver_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    effectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'effective_date',
    },
    reviewDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'review_date',
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'expiry_date',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    regulatoryReferences: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      field: 'regulatory_references',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    organisationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'organisation_id',
      references: {
        model: 'organisations',
        key: 'id',
      },
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
    modelName: 'Policy',
    tableName: 'policies',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_policies_category',
        fields: ['category'],
      },
      {
        name: 'idx_policies_status',
        fields: ['status'],
      },
      {
        name: 'idx_policies_owner',
        fields: ['owner_id'],
      },
    ],
  }
);

export default Policy;
export { PolicyAttributes, PolicyCreationAttributes };
