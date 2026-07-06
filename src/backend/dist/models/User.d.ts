import { Model, Optional } from 'sequelize';
interface UserAttributes {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'faculty' | 'admin' | 'auditor' | 'staff' | 'risk_manager' | 'compliance_officer' | 'manager';
    organisationId: string;
    orgRole: 'owner' | 'admin' | 'member';
    isActive: boolean;
    emailVerified: boolean;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    refreshTokenVersion: number;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
type UserCreationAttributes = Optional<UserAttributes, 'id' | 'organisationId' | 'orgRole' | 'isActive' | 'emailVerified' | 'failedLoginAttempts' | 'lockedUntil' | 'refreshTokenVersion' | 'lastLoginAt' | 'createdAt' | 'updatedAt'>;
declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: 'student' | 'faculty' | 'admin' | 'auditor' | 'staff' | 'risk_manager' | 'compliance_officer' | 'manager';
    organisationId: string;
    orgRole: 'owner' | 'admin' | 'member';
    isActive: boolean;
    emailVerified: boolean;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    refreshTokenVersion: number;
    lastLoginAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default User;
export { UserAttributes, UserCreationAttributes };
//# sourceMappingURL=User.d.ts.map