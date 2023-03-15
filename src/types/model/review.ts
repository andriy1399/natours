import { Document, Types } from 'mongoose';

export interface Review extends Document {
	review: string;
	rating: number;
	createdAt: Date;
	tour: Types.ObjectId;
	user: Types.ObjectId;
}
export interface ReviewDocument extends Review, Document {
	constructor: {
		calcAverageRatings(tourId: Types.ObjectId): Promise<void>;
	};
}
