import { DataTypes, Model, Optional } from 'sequelize';
import database from '../config/database';

interface RiskAttributes {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelihood: 'certain' | 'likely' | 'possible' | 'unlikely' | 'rare';
  riskScore: number | null;
  status: 'identified' | 'assessed' | 'in_treatment' | 'monitoring' | 'closed' | 'archived';
  department: string | null;
  ownerId: string | null;
  source: string | null;
  impactDescription: string | null;
  rootCause: string | null;
  existingControls: string | null;
  treatmentStrategy: 'accept' | 'mitigate' | 'transfer' | 'avoid' | 'monitor' | null;
  residualSeverity: 'critical' | 'high' | 'medium' | 'low' | null;
  residualLikelihood: 'certain' | 'likely' | 'possible' | 'unlikely' | 'rare' | null;
  targetDate: Date | null;
  closedAt: Date | null;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  organisationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type RiskCreationAttributes = Optional<
  RiskAttributes,
  'id' | 'description' | 'category' | 'severity' | 'likelihood' | 'riskScore' | 'status' | 'department' | 'ownerId' | 'source' | 'impactDescription' | 'rootCause' | 'existingControls' | 'treatmentStrategy' | 'residualSeverity' | 'residualLikelihood' | 'targetDate' | 'closedAt' | 'tags' | 'metadata' | 'createdBy' | 'organisationId' | 'createdAt' | 'updatedAt'
>;

class Risk extends Model<RiskAttributes, RiskCreationAttributes> implements RiskAttributes {
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare category: string | null;
  declare severity: 'critical' | 'high' | 'medium' | 'low';
  declare likelihood: 'certain' | 'likely' | 'possible' | 'unlikely' | 'rare';
  declare riskScore: number | null;
  declare status: 'identified' | 'assessed' | 'in_treatment' | 'monitoring' | 'closed' | 'archived';
  declare department: string | null;
  declare ownerId: string | null;
  declare source: string | null;
  declare impactDescription: string | null;
  declare rootCause: string | null;
  declare existingControls: string | null;
  declare treatmentStrategy: 'accept' | 'mitigate' | 'transfer' | 'avoid' | 'monitor' | null;
  declare residualSeverity: 'critical' | 'high' | 'medium' | 'low' | null;
  declare residualLikelihood: 'certain' | 'likely' | 'possible' | 'unlikely' | 'rare' | null;
  declare targetDate: Date | null;
  declare closedAt: Date | null;
  declare tags: string[] | null;
  declare metadata: Record<string, unknown>;
  declare createdBy: string | null;
  declare organisationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Risk.init(
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
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    severity: {
      type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium',
    },
    likelihood: {
      type: DataTypes.ENUM('certain', 'likely', 'possible', 'unlikely', 'rare'),
      allowNull: false,
      defaultValue: 'possible',
    },
    riskScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'risk_score',
    },
    status: {
      type: DataTypes.ENUM('identified', 'assessed', 'in_treatment', 'monitoring', 'closed', 'archived'),
      allowNull: false,
      defaultValue: 'identified',
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
    source: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    impactDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'impact_description',
    },
    rootCause: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'root_cause',
    },
    existingControls: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'existing_controls',
    },
    treatmentStrategy: {
      type: DataTypes.ENUM('accept', 'mitigate', 'transfer', 'avoid', 'monitor'),
      allowNull: true,
      field: 'treatment_strategy',
    },
    residualSeverity: {
      type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
      allowNull: true,
      field: 'residual_severity',
    },
    residualLikelihood: {
      type: DataTypes.ENUM('certain', 'likely', 'possible', 'unlikely', 'rare'),
      allowNull: true,
      field: 'residual_likelihood',
    },
    targetDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'target_date',
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'closed_at',
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
    modelName: 'Risk',
    tableName: 'risks',
    timestamps: true,
    underscored: true,
  }
);

export default Risk;
export { RiskAttributes, RiskCreationAttributes };
