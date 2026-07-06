import { DataTypes, Model, Optional } from 'sequelize';
import database from '../config/database';

interface DocumentAttributes {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  category: string | null;
  department: string | null;
  tags: string[] | null;
  version: number;
  status: 'active' | 'archived' | 'draft' | 'under_review';
  ownerId: string | null;
  createdBy: string | null;
  organisationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type DocumentCreationAttributes = Optional<
  DocumentAttributes,
  'id' | 'description' | 'fileSize' | 'mimeType' | 'category' | 'department' | 'tags' | 'version' | 'status' | 'ownerId' | 'createdBy' | 'organisationId' | 'createdAt' | 'updatedAt'
>;

class Document extends Model<DocumentAttributes, DocumentCreationAttributes> implements DocumentAttributes {
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare fileUrl: string;
  declare fileSize: number | null;
  declare mimeType: string | null;
  declare category: string | null;
  declare department: string | null;
  declare tags: string[] | null;
  declare version: number;
  declare status: 'active' | 'archived' | 'draft' | 'under_review';
  declare ownerId: string | null;
  declare createdBy: string | null;
  declare organisationId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Document.init(
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
    fileUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'file_url',
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'file_size',
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'mime_type',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'draft', 'under_review'),
      allowNull: false,
      defaultValue: 'active',
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
    modelName: 'Document',
    tableName: 'documents',
    timestamps: true,
    underscored: true,
  }
);

export default Document;
export { DocumentAttributes, DocumentCreationAttributes };
