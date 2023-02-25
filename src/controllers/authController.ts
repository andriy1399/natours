import User from '../models/userModel';
import { Role } from '../types/model/user';
import AppError from '../utilities/AppError';
import { catchAsync } from '../utilities/catchAsync';
import { Response, Request, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import Email from '../utilities/Email';

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
	await new Email(newUser, url).sendWelcome();

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
	const decoded = jwtData.payload as DecodedToken;

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

export const restrictTo = (...roles: Role[]): RequestHandler => {
	return (req: AuthRequest, res, next) => {
		if (!req.user || (req.user && !roles.includes(req.user.role))) {
			return next(new AppError('You do not have permission to perform this action', 403));
		}

		next();
	};
};

export const forgotPassword: RequestHandler = catchAsync(async (req, res, next) => {
	// 1) Get user based on POSTed email
	const { email } = req.body;
	const user = await User.findOne({ email });

	if (!user) {
		return next(new AppError('There is no user with email address.', 404));
	}

	// 2) Generate the random reset token
	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });

	// 3) Send it to user's email
	try {
		const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
		await new Email(user, resetURL).sendPasswordReset();

		res.status(200).json({
			status: 'success',
			message: 'Token sent to email!',
		});
	} catch (err) {
		delete user.passwordResetToken;
		delete user.passwordResetExpires;
		await user.save({ validateBeforeSave: false });

		return next(new AppError('There was an error sending the email. Try again later!', 500));
	}
});
