import { DataTypes, Model, Optional } from 'sequelize';
import database from '../config/database';

interface InternalControlAttributes {
  id: string;
  title: string;
  description: string | null;
  controlType: 'preventive' | 'detective' | 'corrective' | 'directive' | 'compensating';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'ad_hoc';
  status: 'draft' | 'active' | 'testing' | 'review' | 'inactive' | 'failed';
  department: string | null;
  ownerId: string | null;
  riskId: string | null;
  requirementId: string | null;
  designEffectiveness: 'effective' | 'partially_effective' | 'ineffective' | 'not_designed' | null;
  operationalEffectiveness: 'effective' | 'partially_effective' | 'ineffective' | 'not_tested' | null;
  lastTestedAt: Date | null;
  nextTestDate: Date | null;
  automationLevel: 'manual' | 'semi_automated' | 'fully_automated' | null;
  controlOwner: string | null;
  evidenceRequired: boolean;
  autoApprove: boolean;
  escalationThreshold: number;
  approvalRequired: boolean;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  organisationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type InternalControlCreationAttributes = Optional<
  InternalControlAttributes,
  'id' | 'description' | 'controlType' | 'frequency' | 'status' | 'department' | 'ownerId' | 'riskId' | 'requirementId' | 'designEffectiveness' | 'operationalEffectiveness' | 'lastTestedAt' | 'nextTestDate' | 'automationLevel' | 'controlOwner' | 'evidenceRequired' | 'autoApprove' | 'escalationThreshold' | 'approvalRequired' | 'tags' | 'metadata' | 'createdBy' | 'organisationId' | 'createdAt' | 'updatedAt'
>;

class InternalControl extends Model<InternalControlAttributes, InternalControlCreationAttributes> implements InternalControlAttributes {
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare controlType: 'preventive' | 'detective' | 'corrective' | 'directive' | 'compensating';
  declare frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'ad_hoc';
  declare status: 'draft' | 'active' | 'testing' | 'review' | 'inactive' | 'failed';
  declare department: string | null;
  declare ownerId: string | null;
  declare riskId: string | null;
  declare requirementId: string | null;
  declare designEffectiveness: 'effective' | 'partially_effective' | 'ineffective' | 'not_designed' | null;
  declare operationalEffectiveness: 'effective' | 'partially_effective' | 'ineffective' | 'not_tested' | null;
  declare lastTestedAt: Date | null;
  declare nextTestDate: Date | null;
  declare automationLevel: 'manual' | 'semi_automated' | 'fully_automated' | null;
  declare controlOwner: string | null;
  declare evidenceRequired: boolean;
  declare autoApprove: boolean;
  declare escalationThreshold: number;
  declare approvalRequired: boolean;
  declare tags: string[] | null;
  declare metadata: Record<string, unknown>;
  declare createdBy: string | null;
  declare organisationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

InternalControl.init(
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
    controlType: {
      type: DataTypes.ENUM('preventive', 'detective', 'corrective', 'directive', 'compensating'),
      allowNull: false,
      defaultValue: 'preventive',
      field: 'control_type',
    },
    frequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'ad_hoc'),
      allowNull: false,
      defaultValue: 'monthly',
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'testing', 'review', 'inactive', 'failed'),
      allowNull: false,
      defaultValue: 'draft',
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
    riskId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'risk_id',
      references: {
        model: 'risks',
        key: 'id',
      },
    },
    requirementId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'requirement_id',
      references: {
        model: 'compliance_requirements',
        key: 'id',
      },
    },
    designEffectiveness: {
      type: DataTypes.ENUM('effective', 'partially_effective', 'ineffective', 'not_designed'),
      allowNull: true,
      field: 'design_effectiveness',
    },
    operationalEffectiveness: {
      type: DataTypes.ENUM('effective', 'partially_effective', 'ineffective', 'not_tested'),
      allowNull: true,
      field: 'operational_effectiveness',
    },
    lastTestedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_tested_at',
    },
    nextTestDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'next_test_date',
    },
    automationLevel: {
      type: DataTypes.ENUM('manual', 'semi_automated', 'fully_automated'),
      allowNull: true,
      field: 'automation_level',
    },
    controlOwner: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'control_owner',
    },
    evidenceRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'evidence_required',
    },
    autoApprove: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'auto_approve',
    },
    escalationThreshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      field: 'escalation_threshold',
    },
    approvalRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'approval_required',
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
    modelName: 'InternalControl',
    tableName: 'internal_controls',
    timestamps: true,
    underscored: true,
  }
);

export default InternalControl;
export { InternalControlAttributes, InternalControlCreationAttributes };
