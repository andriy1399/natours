import express from 'express';
import { protect, restrictTo } from '../controllers/authController';
import {
	getAllReviews,
	setTourUserIds,
	createReview,
	getReview,
	updateReview,
	deleteReview,
} from '../controllers/reviewController';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/').get(getAllReviews).post(restrictTo('user'), setTourUserIds, createReview);

router
	.route('/:id')
	.get(getReview)
	.patch(restrictTo('user', 'admin'), updateReview)
	.delete(restrictTo('user', 'admin'), deleteReview);

export default router;
