import { DataTypes, Model, Optional } from 'sequelize';
import database from '../config/database';

interface ComplianceRequirementAttributes {
  id: string;
  title: string;
  description: string | null;
  regulationSource: string | null;
  regulationSection: string | null;
  category: string | null;
  department: string | null;
  ownerId: string | null;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed' | 'under_review';
  priority: 'critical' | 'high' | 'medium' | 'low' | null;
  effectiveDate: Date | null;
  reviewFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'ad_hoc';
  lastReviewedAt: Date | null;
  nextReviewDate: Date | null;
  penaltyForNonCompliance: string | null;
  supportingDocuments: string[] | null;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  organisationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ComplianceRequirementCreationAttributes = Optional<
  ComplianceRequirementAttributes,
  'id' | 'description' | 'regulationSource' | 'regulationSection' | 'category' | 'department' | 'ownerId' | 'status' | 'priority' | 'effectiveDate' | 'reviewFrequency' | 'lastReviewedAt' | 'nextReviewDate' | 'penaltyForNonCompliance' | 'supportingDocuments' | 'tags' | 'metadata' | 'createdBy' | 'organisationId' | 'createdAt' | 'updatedAt'
>;

class ComplianceRequirement extends Model<ComplianceRequirementAttributes, ComplianceRequirementCreationAttributes> implements ComplianceRequirementAttributes {
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare regulationSource: string | null;
  declare regulationSection: string | null;
  declare category: string | null;
  declare department: string | null;
  declare ownerId: string | null;
  declare status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed' | 'under_review';
  declare priority: 'critical' | 'high' | 'medium' | 'low' | null;
  declare effectiveDate: Date | null;
  declare reviewFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'ad_hoc';
  declare lastReviewedAt: Date | null;
  declare nextReviewDate: Date | null;
  declare penaltyForNonCompliance: string | null;
  declare supportingDocuments: string[] | null;
  declare tags: string[] | null;
  declare metadata: Record<string, unknown>;
  declare createdBy: string | null;
  declare organisationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ComplianceRequirement.init(
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
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    regulationSource: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'regulation_source',
    },
    regulationSection: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'regulation_section',
    },
    category: {
      type: DataTypes.STRING(100),
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
    status: {
      type: DataTypes.ENUM('compliant', 'non_compliant', 'partial', 'not_assessed', 'under_review'),
      allowNull: false,
      defaultValue: 'not_assessed',
    },
    priority: {
      type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
      allowNull: true,
    },
    effectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'effective_date',
    },
    reviewFrequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'ad_hoc'),
      allowNull: false,
      defaultValue: 'annually',
      field: 'review_frequency',
    },
    lastReviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_reviewed_at',
    },
    nextReviewDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'next_review_date',
    },
    penaltyForNonCompliance: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'penalty_for_non_compliance',
    },
    supportingDocuments: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      field: 'supporting_documents',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
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
    modelName: 'ComplianceRequirement',
    tableName: 'compliance_requirements',
    timestamps: true,
    underscored: true,
  }
);

export default ComplianceRequirement;
export { ComplianceRequirementAttributes, ComplianceRequirementCreationAttributes };
