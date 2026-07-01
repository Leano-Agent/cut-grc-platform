import { DataTypes, Model, Optional } from 'sequelize';
import database from '../config/database';

interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'faculty' | 'admin' | 'auditor' | 'staff' | 'risk_manager' | 'compliance_officer' | 'manager';
  isActive: boolean;
  emailVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  refreshTokenVersion: number;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type UserCreationAttributes = Optional<
  UserAttributes,
  'id' | 'isActive' | 'emailVerified' | 'failedLoginAttempts' | 'lockedUntil' | 'refreshTokenVersion' | 'lastLoginAt' | 'createdAt' | 'updatedAt'
>;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare passwordHash: string;
  declare firstName: string;
  declare lastName: string;
  declare role: 'student' | 'faculty' | 'admin' | 'auditor' | 'staff' | 'risk_manager' | 'compliance_officer' | 'manager';
  declare isActive: boolean;
  declare emailVerified: boolean;
  declare failedLoginAttempts: number;
  declare lockedUntil: Date | null;
  declare refreshTokenVersion: number;
  declare lastLoginAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('student', 'faculty', 'admin', 'auditor', 'staff', 'risk_manager', 'compliance_officer', 'manager'),
      allowNull: false,
      defaultValue: 'student',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refreshTokenVersion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: database.getSequelize(),
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: false,
  }
);

export default User;
export { UserAttributes, UserCreationAttributes };
