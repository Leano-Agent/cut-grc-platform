"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Organisation extends sequelize_1.Model {
}
Organisation.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    slug: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    domain: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    logoUrl: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        field: 'logo_url',
    },
    primaryColor: {
        type: sequelize_1.DataTypes.STRING(7),
        allowNull: true,
        field: 'primary_color',
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
    },
    subscriptionTier: {
        type: sequelize_1.DataTypes.ENUM('free', 'starter', 'professional', 'enterprise'),
        allowNull: false,
        defaultValue: 'free',
        field: 'subscription_tier',
    },
    maxUsers: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 50,
        field: 'max_users',
    },
    settings: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
        field: 'created_at',
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
        field: 'updated_at',
    },
}, {
    sequelize: database_1.default.getSequelize(),
    modelName: 'Organisation',
    tableName: 'organisations',
    timestamps: true,
    underscored: true,
});
exports.default = Organisation;
//# sourceMappingURL=Organisation.js.map