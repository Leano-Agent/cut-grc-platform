import { DataTypes, Model, Optional } from 'sequelize';
import database from '../config/database';

interface ActionChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
  assignedTo: string | null;
}

interface ActionComment {
  id: string;
  comment: string;
  userId: string | null;
  createdAt: string;
}

interface ActionAttributes {
  id: string;
  title: string;
  description: string | null;
  source: 'audit' | 'incident' | 'risk' | 'compliance' | 'policy' | 'survey' | 'board' | 'control' | 'vendor' | 'other';
  sourceId: string | null;
  sourceRef: string | null;
  status: 'open' | 'in_progress' | 'under_review' | 'closed' | 'rejected';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'corrective' | 'preventive' | 'improvement';
  department: string | null;
  assignedTo: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  rootCause: string | null;
  resolution: string | null;
  closureNotes: string | null;
  evidence: string[] | null;
  relatedActionIds: string[] | null;
  tags: string[] | null;
  checklist: ActionChecklistItem[];
  comments: ActionComment[];
  metadata: Record<string, unknown>;
  createdBy: string | null;
  organisationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ActionCreationAttributes = Optional<ActionAttributes,
  'id' | 'description' | 'source' | 'sourceId' | 'sourceRef' | 'status' | 'priority' | 'category' |
  'department' | 'assignedTo' | 'dueDate' | 'completedAt' | 'rootCause' | 'resolution' | 'closureNotes' |
  'evidence' | 'relatedActionIds' | 'tags' | 'checklist' | 'comments' | 'metadata' | 'createdBy' | 'organisationId' | 'createdAt' | 'updatedAt'
>;

class Action extends Model<ActionAttributes, ActionCreationAttributes> implements ActionAttributes {
  declare id: string; declare title: string; declare description: string | null;
  declare source: string; declare sourceId: string | null; declare sourceRef: string | null;
  declare status: string; declare priority: string; declare category: string;
  declare department: string | null; declare assignedTo: string | null;
  declare dueDate: Date | null; declare completedAt: Date | null;
  declare rootCause: string | null; declare resolution: string | null;
  declare closureNotes: string | null; declare evidence: string[] | null;
  declare relatedActionIds: string[] | null; declare tags: string[] | null;
  declare checklist: ActionChecklistItem[]; declare comments: ActionComment[];
  declare metadata: Record<string, unknown>;
  declare createdBy: string | null; declare organisationId: string | null;
  declare createdAt: Date; declare updatedAt: Date;
}

Action.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  source: { type: DataTypes.ENUM('audit', 'incident', 'risk', 'compliance', 'policy', 'survey', 'board', 'control', 'vendor', 'other'), allowNull: false, defaultValue: 'other' },
  sourceId: { type: DataTypes.STRING(100), allowNull: true, field: 'source_id' },
  sourceRef: { type: DataTypes.STRING(255), allowNull: true, field: 'source_ref' },
  status: { type: DataTypes.ENUM('open', 'in_progress', 'under_review', 'closed', 'rejected'), allowNull: false, defaultValue: 'open' },
  priority: { type: DataTypes.ENUM('critical', 'high', 'medium', 'low'), allowNull: false, defaultValue: 'medium' },
  category: { type: DataTypes.ENUM('corrective', 'preventive', 'improvement'), allowNull: false, defaultValue: 'corrective' },
  department: { type: DataTypes.STRING(100), allowNull: true },
  assignedTo: { type: DataTypes.UUID, allowNull: true, field: 'assigned_to', references: { model: 'users', key: 'id' } },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'due_date' },
  completedAt: { type: DataTypes.DATE, allowNull: true, field: 'completed_at' },
  rootCause: { type: DataTypes.TEXT, allowNull: true, field: 'root_cause' },
  resolution: { type: DataTypes.TEXT, allowNull: true },
  closureNotes: { type: DataTypes.TEXT, allowNull: true, field: 'closure_notes' },
  evidence: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true },
  relatedActionIds: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, field: 'related_action_ids' },
  tags: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true },
  checklist: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  comments: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  organisationId: { type: DataTypes.UUID, allowNull: true, field: 'organisation_id' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
}, {
  sequelize: database.getSequelize(),
  modelName: 'Action',
  tableName: 'actions',
  timestamps: true,
  underscored: true,
  indexes: [
    { name: 'idx_actions_status', fields: ['status'] },
    { name: 'idx_actions_priority', fields: ['priority'] },
    { name: 'idx_actions_source', fields: ['source'] },
    { name: 'idx_actions_assigned', fields: ['assigned_to'] },
    { name: 'idx_actions_due_date', fields: ['due_date'] },
  ],
});

export default Action;
export { ActionAttributes, ActionCreationAttributes, ActionChecklistItem, ActionComment };
