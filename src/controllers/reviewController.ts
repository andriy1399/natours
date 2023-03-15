
import * as factory from './handleFactory';
import Review from '../models/reviewModel';
import { NextFunction, Response} from 'express-serve-static-core';
import { AuthRequest } from '../types/auth';

export const setTourUserIds = (req: AuthRequest, res: Response, next: NextFunction) => {
	// Allow nested routes
	if (!req.body?.tour) req.body.tour = req.params.tourId;
	if (!req.body?.user) req.body.user = req.user?.id;
	next();
};

export const getAllReviews = factory.getAll(Review);
export const getReview = factory.getOne(Review);
export const createReview = factory.createOne(Review);
export const updateReview = factory.updateOne(Review);
export const deleteReview = factory.deleteOne(Review);
