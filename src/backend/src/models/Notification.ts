import { DataTypes, Model, Optional } from 'sequelize';
import database from '../config/database';

interface NotificationAttributes {
  id: string;
  userId: string;
  type: 'risk_alert' | 'compliance_due' | 'control_failure' | 'approval_needed' | 'system';
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  readAt: Date | null;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  organisationId: string | null;
  createdAt: Date;
}

type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  'id' | 'type' | 'message' | 'link' | 'isRead' | 'readAt' | 'entityType' | 'entityId' | 'metadata' | 'organisationId' | 'createdAt'
>;

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  declare id: string;
  declare userId: string;
  declare type: 'risk_alert' | 'compliance_due' | 'control_failure' | 'approval_needed' | 'system';
  declare title: string;
  declare message: string | null;
  declare link: string | null;
  declare isRead: boolean;
  declare readAt: Date | null;
  declare entityType: string | null;
  declare entityId: string | null;
  declare metadata: Record<string, unknown>;
  declare organisationId: string | null;
  declare readonly createdAt: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('risk_alert', 'compliance_due', 'control_failure', 'approval_needed', 'system'),
      allowNull: false,
      defaultValue: 'system',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    link: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read',
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at',
    },
    entityType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'entity_type',
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'entity_id',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
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
  },
  {
    sequelize: database.getSequelize(),
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: false,
    underscored: true,
  }
);

export default Notification;
export { NotificationAttributes, NotificationCreationAttributes };
