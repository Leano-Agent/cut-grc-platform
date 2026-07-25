import { DataTypes, Model, Optional } from 'sequelize';
import database from '../config/database';

interface BoardMember {
  userId: string;
  role: 'chairperson' | 'vice_chairperson' | 'secretary' | 'member' | 'observer' | 'advisor';
  position: string | null;
  appointedAt: Date;
  termEnd: Date | null;
  isActive: boolean;
}

interface MeetingRecord {
  id: string;
  title: string;
  date: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  location: string | null;
  agenda: { item: string; description: string | null; presenter: string | null; duration: number | null }[];
  minutes: string | null;
  decisions: { title: string; description: string; status: string; owner: string | null; dueDate: Date | null }[];
  attendance: { userId: string; status: 'present' | 'absent' | 'excused' | 'late' }[];
}

interface BoardAttributes {
  id: string;
  name: string;
  description: string | null;
  type: 'board' | 'committee' | 'subcommittee' | 'task_force' | 'working_group';
  category: 'audit' | 'risk' | 'compliance' | 'governance' | 'finance' | 'hr' | 'it' | 'strategy' | 'other';
  status: 'active' | 'inactive' | 'dissolved';
  charter: string | null;
  mission: string | null;
  meetingFrequency: string | null;
  quorum: number | null;
  termLength: number | null;
  parentBoardId: string | null;
  members: BoardMember[];
  meetings: MeetingRecord[];
  tags: string[] | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  organisationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type BoardCreationAttributes = Optional<
  BoardAttributes,
  'id' | 'description' | 'type' | 'category' | 'status' | 'charter' | 'mission' | 'meetingFrequency' | 'quorum' | 'termLength' | 'parentBoardId' | 'members' | 'meetings' | 'tags' | 'metadata' | 'createdBy' | 'organisationId' | 'createdAt' | 'updatedAt'
>;

class Board extends Model<BoardAttributes, BoardCreationAttributes> implements BoardAttributes {
  declare id: string; declare name: string; declare description: string | null;
  declare type: string; declare category: string; declare status: string;
  declare charter: string | null; declare mission: string | null;
  declare meetingFrequency: string | null; declare quorum: number | null;
  declare termLength: number | null; declare parentBoardId: string | null;
  declare members: BoardMember[]; declare meetings: MeetingRecord[];
  declare tags: string[] | null; declare metadata: Record<string, unknown>;
  declare createdBy: string | null; declare organisationId: string | null;
  declare createdAt: Date; declare updatedAt: Date;
}

Board.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  type: { type: DataTypes.ENUM('board', 'committee', 'subcommittee', 'task_force', 'working_group'), allowNull: false, defaultValue: 'committee' },
  category: { type: DataTypes.ENUM('audit', 'risk', 'compliance', 'governance', 'finance', 'hr', 'it', 'strategy', 'other'), allowNull: false, defaultValue: 'other' },
  status: { type: DataTypes.ENUM('active', 'inactive', 'dissolved'), allowNull: false, defaultValue: 'active' },
  charter: { type: DataTypes.TEXT, allowNull: true },
  mission: { type: DataTypes.TEXT, allowNull: true },
  meetingFrequency: { type: DataTypes.STRING(100), allowNull: true, field: 'meeting_frequency' },
  quorum: { type: DataTypes.INTEGER, allowNull: true },
  termLength: { type: DataTypes.INTEGER, allowNull: true, field: 'term_length' },
  parentBoardId: { type: DataTypes.UUID, allowNull: true, field: 'parent_board_id' },
  members: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  meetings: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  tags: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true },
  metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  organisationId: { type: DataTypes.UUID, allowNull: true, field: 'organisation_id' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
}, {
  sequelize: database.getSequelize(),
  modelName: 'Board',
  tableName: 'boards',
  timestamps: true,
  underscored: true,
  indexes: [{ name: 'idx_boards_type', fields: ['type'] }, { name: 'idx_boards_status', fields: ['status'] }, { name: 'idx_boards_category', fields: ['category'] }],
});

export default Board;
export { BoardAttributes, BoardCreationAttributes, BoardMember, MeetingRecord };
