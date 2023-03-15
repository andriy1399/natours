import User from '../models/userModel';
import AppError from '../utilities/AppError';
import { catchAsync } from '../utilities/catchAsync';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
import multer from 'multer';
import sharp from 'sharp';
import { deleteOne, getAll, getOne, updateOne } from './handleFactory';

const multerStorage = multer.memoryStorage();

const multerFilter = (_: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new Error('Not an image! Please upload only images.'));
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter,
});

export const uploadUserPhoto = upload.single('photo');

export const resizeUserPhoto = catchAsync(async (req: AuthRequest, res, next) => {
	if (!req.file) return next();

	req.file.filename = `user-${req.user?.id}-${Date.now()}.jpeg`;

	await sharp(req.file.buffer)
		.resize(500, 500)
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`public/img/users/${req.file.filename}`);

	next();
});

const filterObj = <T, K extends keyof T>(obj: T, ...allowedFields: K[]): Pick<T, K> => {
	const newObj = {} as Pick<T, K>;

	allowedFields.forEach((field) => {
		newObj[field] = obj[field];
	});

	return newObj;
};

export const getMe = (req: AuthRequest, res: Response, next: NextFunction) => {
	req.params.id = req.user?.id;
	next();
};

export const updateMe = catchAsync(async (req: AuthRequest, res, next) => {
	// 1) Create error if user POSTs password data
	if (req.body.password || req.body.passwordConfirm) {
		return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
	}

	// 2) Filtered out unwanted fields names that are not allowed to be updated
	const filteredBody = filterObj(req.body, 'name', 'email') as Record<string, any>;
	if (req.file) filteredBody.photo = req.file.filename;

	// 3) Update user document
	const updatedUser = await User.findByIdAndUpdate(req.user?.id, filteredBody, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		status: 'success',
		data: {
			user: updatedUser,
		},
	});
});

export const deleteMe = catchAsync(async (req: AuthRequest, res, next) => {
	await User.findByIdAndUpdate(req.user?.id, { active: false });

	res.status(204).json({
		status: 'success',
		data: null,
	});
});

export const getUser = getOne(User);
export const getAllUsers = getAll(User);

// Do NOT update passwords with this!
export const updateUser = updateOne(User);
export const deleteUser = deleteOne(User);
