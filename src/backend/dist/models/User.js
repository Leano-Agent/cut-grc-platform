"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class User extends sequelize_1.Model {
}
User.init({
    id: {
        type: sequelize_1.DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    passwordHash: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('student', 'faculty', 'admin', 'auditor', 'staff', 'risk_manager', 'compliance_officer', 'manager'),
        allowNull: false,
        defaultValue: 'student',
    },
    organisationId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: 'organisation_id',
        references: {
            model: 'organisations',
            key: 'id',
        },
    },
    orgRole: {
        type: sequelize_1.DataTypes.ENUM('owner', 'admin', 'member'),
        allowNull: false,
        defaultValue: 'member',
        field: 'org_role',
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    emailVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    failedLoginAttempts: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    lockedUntil: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    refreshTokenVersion: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    lastLoginAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.default.getSequelize(),
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: false,
});
exports.default = User;
//# sourceMappingURL=User.js.map