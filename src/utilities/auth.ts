import jwt from 'jsonwebtoken';
import CryptoJS from 'crypto-js';
export const signToken = (id: string): string => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};

export const generateRefreshToken = (): string => {
	const bytes = CryptoJS.lib.WordArray.random(64 / 8);
	return bytes.toString(CryptoJS.enc.Hex);
};