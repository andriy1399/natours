import User from '../models/userModel';
import AppError from '../utilities/AppError';
import { catchAsync } from '../utilities/catchAsync';
import { Response, Request, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
	user?: User;
}

interface DecodedToken {
	id: string;
	iat: number;
	exp: number;
}
const signToken = (id: string): string => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};
const createSendToken = (user: User, statusCode: number, req: Request, res: Response) => {
	const token = signToken(user._id);

	res.cookie('jwt', token, {
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
		httpOnly: true,
		secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
	});

	// Remove password from output
	delete user.password;

	res.status(statusCode).json({
		status: 'success',
		token,
		data: {
			user,
		},
	});
};

export const signup = catchAsync(async (req, res, next) => {
	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
	});

	const url = `${req.protocol}://${req.get('host')}/me`;
	// await new Email(newUser, url).sendWelcome();

	createSendToken(newUser, 201, req, res);
});

export const login = catchAsync(async (req, res, next) => {
	const { email, password } = req.body;
	if (!email || !password) {
		return next(new AppError('Please provide email and password!', 400));
	}

	const user = await User.findOne({ email }).select('+password');

	if (!user || !(await user.correctPassword(password, user.password || ''))) {
		return next(new AppError('Incorrect email or password', 401));
	}

	createSendToken(user, 200, req, res);
});

export const logout = catchAsync(async (req, res, next) => {
	res.cookie('jwt', 'loggedout', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
	});
	res.status(200).json({ status: 'success' });
});



export const protect = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
	// 1) Getting token and check if it's there
	let token: string | undefined;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1];
	} else if (req.cookies.jwt) {
		token = req.cookies.jwt;
	}

	if (!token) {
		return next(new AppError('You are not logged in! Please log in to get access.', 401));
	}

	// 2) Verify token

	const jwtData = jwt.verify(token, process.env.JWT_SECRET!, { complete: true });
  const decoded = jwtData.payload as DecodedToken
  
	// 3) Check if user still exists
	const currentUser = await User.findById(decoded.id);
	if (!currentUser) {
		return next(new AppError('The user belonging to this token does not exist.', 401));
	}

	// 4) Check if user changed password after the token was issued
	if (currentUser.changedPasswordAfter(decoded.iat)) {
		return next(new AppError('User recently changed password! Please log in again.', 401));
	}

	// GRANT ACCESS TO PROTECTED ROUTE
	req.user = currentUser;
	next();
});