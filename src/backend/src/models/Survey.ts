import { DataTypes, Model, Optional } from 'sequelize';
import database from '../config/database';

interface QuestionSchema {
  id: string;
  type: 'text' | 'paragraph' | 'multiple_choice' | 'single_choice' | 'rating' | 'date' | 'file' | 'email' | 'number';
  title: string;
  description: string | null;
  required: boolean;
  options: string[] | null;
  defaultValue: string | null;
  order: number;
  validation: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  } | null;
}

interface SurveyAttributes {
  id: string;
  title: string;
  description: string | null;
  category: 'compliance' | 'risk_assessment' | 'audit' | 'training' | 'employee' | 'customer' | 'vendor' | 'security' | 'other';
  status: 'draft' | 'published' | 'closed' | 'archived';
  questions: QuestionSchema[];
  department: string | null;
  targetAudience: string | null;
  anonymous: boolean;
  requireLogin: boolean;
  allowMultipleSubmissions: boolean;
  maxSubmissions: number | null;
  closeDate: Date | null;
  totalResponses: number;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  organisationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type SurveyCreationAttributes = Optional<
  SurveyAttributes,
  'id' | 'description' | 'category' | 'status' | 'questions' | 'department' | 'targetAudience' | 'anonymous' | 'requireLogin' | 'allowMultipleSubmissions' | 'maxSubmissions' | 'closeDate' | 'totalResponses' | 'tags' | 'metadata' | 'createdBy' | 'organisationId' | 'createdAt' | 'updatedAt'
>;

class Survey extends Model<SurveyAttributes, SurveyCreationAttributes> implements SurveyAttributes {
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare category: 'compliance' | 'risk_assessment' | 'audit' | 'training' | 'employee' | 'customer' | 'vendor' | 'security' | 'other';
  declare status: 'draft' | 'published' | 'closed' | 'archived';
  declare questions: QuestionSchema[];
  declare department: string | null;
  declare targetAudience: string | null;
  declare anonymous: boolean;
  declare requireLogin: boolean;
  declare allowMultipleSubmissions: boolean;
  declare maxSubmissions: number | null;
  declare closeDate: Date | null;
  declare totalResponses: number;
  declare tags: string[] | null;
  declare metadata: Record<string, unknown>;
  declare createdBy: string | null;
  declare organisationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Survey.init(
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
      type: DataTypes.ENUM(
        'compliance', 'risk_assessment', 'audit', 'training',
        'employee', 'customer', 'vendor', 'security', 'other'
      ),
      allowNull: false,
      defaultValue: 'other',
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'closed', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    questions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    targetAudience: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'target_audience',
    },
    anonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    requireLogin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'require_login',
    },
    allowMultipleSubmissions: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'allow_multiple_submissions',
    },
    maxSubmissions: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_submissions',
    },
    closeDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'close_date',
    },
    totalResponses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_responses',
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
    modelName: 'Survey',
    tableName: 'surveys',
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'idx_surveys_status', fields: ['status'] },
      { name: 'idx_surveys_category', fields: ['category'] },
    ],
  }
);

export default Survey;
export { SurveyAttributes, SurveyCreationAttributes, QuestionSchema };
