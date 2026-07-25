import { DataTypes, Model, Optional } from 'sequelize';
import database from '../config/database';

interface IncidentAttributes {
  id: string;
  title: string;
  description: string | null;
  category: 'security' | 'data_breach' | 'fraud' | 'compliance_violation' | 'operational' | 'hr' | 'physical' | 'privacy' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'reported' | 'investigating' | 'contained' | 'resolved' | 'closed';
  reportedBy: string | null;
  assignedTo: string | null;
  department: string | null;
  location: string | null;
  detectionMethod: string | null;
  impact: string | null;
  rootCause: string | null;
  remediation: string | null;
  lessonsLearned: string | null;
  slaDeadline: Date | null;
  slaBreached: boolean;
  resolvedAt: Date | null;
  closedAt: Date | null;
  tags: string[] | null;
  evidence: string[] | null;
  regulatoryObligations: string[] | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  organisationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type IncidentCreationAttributes = Optional<
  IncidentAttributes,
  'id' | 'description' | 'category' | 'severity' | 'priority' | 'status' | 'reportedBy' | 'assignedTo' | 'department' | 'location' | 'detectionMethod' | 'impact' | 'rootCause' | 'remediation' | 'lessonsLearned' | 'slaDeadline' | 'slaBreached' | 'resolvedAt' | 'closedAt' | 'tags' | 'evidence' | 'regulatoryObligations' | 'metadata' | 'createdBy' | 'organisationId' | 'createdAt' | 'updatedAt'
>;

class Incident extends Model<IncidentAttributes, IncidentCreationAttributes> implements IncidentAttributes {
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare category: 'security' | 'data_breach' | 'fraud' | 'compliance_violation' | 'operational' | 'hr' | 'physical' | 'privacy' | 'other';
  declare severity: 'critical' | 'high' | 'medium' | 'low';
  declare priority: 'critical' | 'high' | 'medium' | 'low';
  declare status: 'reported' | 'investigating' | 'contained' | 'resolved' | 'closed';
  declare reportedBy: string | null;
  declare assignedTo: string | null;
  declare department: string | null;
  declare location: string | null;
  declare detectionMethod: string | null;
  declare impact: string | null;
  declare rootCause: string | null;
  declare remediation: string | null;
  declare lessonsLearned: string | null;
  declare slaDeadline: Date | null;
  declare slaBreached: boolean;
  declare resolvedAt: Date | null;
  declare closedAt: Date | null;
  declare tags: string[] | null;
  declare evidence: string[] | null;
  declare regulatoryObligations: string[] | null;
  declare metadata: Record<string, unknown>;
  declare createdBy: string | null;
  declare organisationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Incident.init(
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
        notEmpty: { msg: 'Incident title is required' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM(
        'security', 'data_breach', 'fraud', 'compliance_violation',
        'operational', 'hr', 'physical', 'privacy', 'other'
      ),
      allowNull: false,
      defaultValue: 'other',
    },
    severity: {
      type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium',
    },
    priority: {
      type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.ENUM('reported', 'investigating', 'contained', 'resolved', 'closed'),
      allowNull: false,
      defaultValue: 'reported',
    },
    reportedBy: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'reported_by',
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assigned_to',
      references: { model: 'users', key: 'id' },
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    detectionMethod: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'detection_method',
    },
    impact: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rootCause: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'root_cause',
    },
    remediation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lessonsLearned: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'lessons_learned',
    },
    slaDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sla_deadline',
    },
    slaBreached: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'sla_breached',
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at',
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
    evidence: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    regulatoryObligations: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      field: 'regulatory_obligations',
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
      references: { model: 'users', key: 'id' },
    },
    organisationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'organisation_id',
      references: { model: 'organisations', key: 'id' },
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
    modelName: 'Incident',
    tableName: 'incidents',
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'idx_incidents_status', fields: ['status'] },
      { name: 'idx_incidents_severity', fields: ['severity'] },
      { name: 'idx_incidents_assigned', fields: ['assigned_to'] },
      { name: 'idx_incidents_category', fields: ['category'] },
    ],
  }
);

export default Incident;
export { IncidentAttributes, IncidentCreationAttributes };
