import mongoose, { Schema, SchemaDefinitionProperty, Types } from 'mongoose';
import { Review, ReviewDocument } from '../types/model/review';
import Tour from './tourModel';

// review / rating / createdAt / ref to tour / ref to user
interface ReviewQuery<ResultType, DocType, THelpers = {}, RawDocType = DocType>
	extends mongoose.Query<ResultType, DocType, THelpers, RawDocType> {
	r?: ResultType;
}
const reviewSchema = new Schema<ReviewDocument>(
	{
		review: {
			type: String,
			required: [true, 'Review can not be empty!'],
		},
		rating: {
			type: Number,
			min: 1,
			max: 5,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		tour: {
			type: Types.ObjectId,
			ref: 'Tour',
			required: [true, 'Review must belong to a tour.'],
		} as SchemaDefinitionProperty<Types.ObjectId>,
		user: {
			type: Types.ObjectId,
			ref: 'User',
			required: [true, 'Review must belong to a user'],
		} as SchemaDefinitionProperty<Types.ObjectId>,
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
	this.populate({
		path: 'user',
		select: 'name photo',
	});
	next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
	const stats = await this.aggregate([
		{
			$match: { tour: tourId },
		},
		{
			$group: {
				_id: '$tour',
				nRating: { $sum: 1 },
				avgRating: { $avg: '$rating' },
			},
		},
	]);

	if (stats.length > 0) {
		await Tour.findByIdAndUpdate(tourId, {
			ratingsQuantity: stats[0].nRating,
			ratingsAverage: stats[0].avgRating,
		});
	} else {
		await Tour.findByIdAndUpdate(tourId, {
			ratingsQuantity: 0,
			ratingsAverage: 4.5,
		});
	}
};

reviewSchema.post('save', function () {
	// this points to current review
	this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete

reviewSchema.pre<ReviewQuery<ReviewDocument | null, ReviewDocument>>(/^findOneAnd/, async function (next) {
	this.r = await this.findOne();
	next();
});

reviewSchema.post<ReviewQuery<ReviewDocument | null, ReviewDocument>>(/^findOneAnd/, async function () {
	// await this.findOne(); does NOT work here, query has already executed
	await this.r?.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model<ReviewDocument>('Review', reviewSchema);

export default Review;
