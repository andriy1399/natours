import { Document } from "mongoose";

export type Role = 'user' | 'guide' | 'lead-guide' | 'admin';

export interface User extends Document {
	name: string;
	email: string;
	photo?: string;
	role: Role;
	password?: string;
	passwordConfirm?: string;
	passwordChangedAt: Date;
	passwordResetToken?: string;
	passwordResetExpires?: Date;
	active: boolean;
    isNew: boolean;
	refreshToken?: string;
	correctPassword: (incomingPassword: string, password: string) => Promise<boolean>;
	changedPasswordAfter: (JWTTimestamp: number) => boolean;
	createPasswordResetToken: () => string;
}

