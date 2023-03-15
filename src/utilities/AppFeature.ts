import { Document, Query } from 'mongoose';

export interface QueryParams {
	page: string;
	sort: string;
	limit: string;
	fields: string;
	[key: string]: string | undefined;
}

class APIFeatures<T extends Document> {
	constructor(public query: Query<T[], T>, public queryParams: QueryParams) {}

	public filter(): this {
		const queryObj: QueryParams = { ...this.queryParams };
		const excludedFields: string[] = ['page', 'sort', 'limit', 'fields'];
		excludedFields.forEach((el: string) => delete queryObj[el]);

		// Advanced filtering
		let queryStr: string = JSON.stringify(queryObj);
		queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match: string) => `${match}`);

		this.query = this.query.find(JSON.parse(queryStr));

		return this;
	}

	public sort(): this {
		if (this.queryParams.sort) {
			const sortBy: string = this.queryParams.sort.split(',').join(' ');
			this.query = this.query.sort(sortBy);
		} else {
			this.query = this.query.sort('-createdAt');
		}

		return this;
	}

	public limitFields(): this {
		if (this.queryParams.fields) {
			const fields: string = this.queryParams.fields.split(',').join(' ');
			this.query = this.query.select(fields);
		} else {
			this.query = this.query.select('-__v');
		}

		return this;
	}

	public paginate(): this {
		const page: number = +this.queryParams.page * 1 || 1;
		const limit: number = +this.queryParams.limit * 1 || 100;
		const skip: number = (page - 1) * limit;

		this.query = this.query.skip(skip).limit(limit);

		return this;
	}
}

export default APIFeatures;
