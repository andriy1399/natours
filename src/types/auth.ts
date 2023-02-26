import User from "../models/userModel";
import { Request } from 'express';

export interface AuthRequest extends Request {
	user?: User;
}

export interface DecodedToken {
	id: string;
	iat: number;
	exp: number;
}