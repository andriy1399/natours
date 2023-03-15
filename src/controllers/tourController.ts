import multer from 'multer';
import sharp from 'sharp';
import { Request } from 'express';
import { catchAsync } from '../utilities/catchAsync';
import * as factory from './handleFactory';
import Tour from '../models/tourModel';
import AppError from '../utilities/AppError';
import { Tour as TourDocument } from '../types/model/tour';
import { RequestHandler } from 'express-serve-static-core';
const multerStorage = multer.memoryStorage();
export interface UploadTourImagesRequest extends Request {
	files: {
		imageCover: UploadedFile[];
		images: UploadedFile[];
	};
	body: {
		imageCover: string;
		images: string[];
        id: string;
	} & Partial<Pick<TourDocument, 'id'>>;
}


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

type UploadedFile = Express.Multer.File & { buffer: Buffer };

export const uploadTourImages = upload.fields([
	{ name: 'imageCover', maxCount: 1 },
	{ name: 'images', maxCount: 3 },
]);

export const resizeTourImages = catchAsync(async (req: any, res, next) => {
	if (!req?.files?.imageCover || !req.files.images) return next();

	const tourId = req.body.id;
	const images: string[] = [];

	// 1) Cover image
	const imageCover = req.files.imageCover[0];
	const imageCoverFilename = `tour-${tourId}-${Date.now()}-cover.jpeg`;
	await sharp(imageCover.buffer)
		.resize(2000, 1333)
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`public/img/tours/${imageCoverFilename}`);

	req.body.imageCover = imageCoverFilename;

	// 2) Images
	await Promise.all(
		req.files.images.map(async (file: { buffer: sharp.SharpOptions | undefined; }, i: number) => {
			const filename = `tour-${tourId}-${Date.now()}-${i + 1}.jpeg`;

			await sharp(file.buffer)
				.resize(2000, 1333)
				.toFormat('jpeg')
				.jpeg({ quality: 90 })
				.toFile(`public/img/tours/${filename}`);

			images.push(filename);
		})
	);

	req.body.images = images;

	next();
});

export const aliasTopTours: RequestHandler = (req, res, next) => {
	req.query.limit = '5';
	req.query.sort = '-ratingsAverage price';
	req.query.fields = 'name price ratingsAverage summary difficulty';
	next();
};

export const getAllTours = factory.getAll(Tour);
export const getTour = factory.getOne(Tour, { path: 'reviews' });
export const createTour = factory.createOne(Tour);
export const updateTour = factory.updateOne(Tour);
export const deleteTour = factory.deleteOne(Tour);
export const getTourStats: RequestHandler = catchAsync(async (req, res, next) => {
	const stats = await Tour.aggregate([
		{
			$match: { ratingsAverage: { $gte: 4.5 } },
		},
		{
			$group: {
				_id: { $toUpper: '$difficulty' },
				numTours: { $sum: 1 },
				numRatings: { $sum: '$ratingsQuantity' },
				avgRating: { $avg: '$ratingsAverage' },
				avgPrice: { $avg: '$price' },
				minPrice: { $min: '$price' },
				maxPrice: { $max: '$price' },
			},
		},
		{
			$sort: { avgPrice: 1 },
		},
		// {
		// $match: { _id: { $ne: 'EASY' } }
		// }
	]);

	res.status(200).json({
		status: 'success',
		data: {
			stats,
		},
	});
});

// export const getMonthlyPlan: RequestHandler = catchAsync(async (req, res, next) => {
// const year = req.params.year * 1; // 2021

// const plan = await Tour.aggregate([
// {
// $unwind: '$startDates'
// },
// {
// $match: {
// startDates: {
// $gte: new Date(${year}-01-01),
// $lte: new Date(${year}-12-31)
// }
// }
// },
// {
// $group: {
// _id: { $month: '$startDates' },
// numTourStarts: { $sum: 1 },
// tours: { $push: '$name' }
// }
// },
// {
// $addFields: { month: '$_id' }
// },
// {
// $project: {
// _id: 0
// }
// },
// {
// $sort: { numTourStarts: -1 }
// },
// {
// $limit: 12
// }
// ]);

// res.status(200).json({
// status: 'success',
// data: {
// plan
// }
// });
// });

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
export const getToursWithin: RequestHandler = catchAsync(async (req, res, next) => {
	const { distance, latlng, unit } = req.params;
	const [lat, lng] = latlng.split(',');

	const radius = unit === 'mi' ? +distance / 3963.2 : +distance / 6378.1;

	if (!lat || !lng) {
		next(new AppError('Please provide latitude and longitude in the format lat,lng.', 400));
	}

	const tours = await Tour.find({
		startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
	});

	res.status(200).json({
		status: 'success',
		results: tours.length,
		data: {
			data: tours,
		},
	});
});

export const getDistances = catchAsync(async (req, res, next) => {
	const { latlng, unit } = req.params;
	const [lat, lng] = latlng.split(',');

	const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

	if (!lat || !lng) {
		return next(new AppError('Please provide latitude and longitude in the format lat,lng.', 400));
	}

	const distances = await Tour.aggregate([
		{
			$geoNear: {
				near: {
					type: 'Point',
					coordinates: [+lng * 1, +lat * 1],
				},
				distanceField: 'distance',
				distanceMultiplier: multiplier,
			},
		},
		{
			$project: {
				distance: 1,
				name: 1,
			},
		},
	]);

	res.status(200).json({
		status: 'success',
		data: {
			data: distances,
		},
	});
});
