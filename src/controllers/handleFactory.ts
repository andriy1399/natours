import { RequestHandler } from 'express';
import { Model, PopulateOptions } from 'mongoose';
import { catchAsync } from '../utilities/catchAsync';
import AppError from '../utilities/AppError';
import APIFeatures, { QueryParams } from '../utilities/AppFeature';

export const deleteOne = <T>(Model: Model<T>): RequestHandler =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.findByIdAndDelete(req.params.id);

		if (!doc) {
			return next(new AppError('No document found with that ID', 404));
		}

		res.status(204).json({
			status: 'success',
			data: null,
		});
	});

export const updateOne = <T>(Model: Model<T>): RequestHandler =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});

		if (!doc) {
			return next(new AppError('No document found with that ID', 404));
		}

		res.status(200).json({
			status: 'success',
			data: {
				data: doc,
			},
		});
	});

export const createOne = <T>(Model: Model<T>): RequestHandler =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.create(req.body);

		res.status(201).json({
			status: 'success',
			data: {
				data: doc,
			},
		});
	});

export const getOne = <T>(Model: Model<T>, popOptions?: PopulateOptions): RequestHandler =>
	catchAsync(async (req, res, next) => {
		let query = Model.findById(req.params.id);
		if (popOptions) query = query.populate(popOptions) as typeof query;
		const doc = await query;

		if (!doc) {
			return next(new AppError('No document found with that ID', 404));
		}

		res.status(200).json({
			status: 'success',
			data: {
				data: doc,
			},
		});
	});

export const getAll = <T>(Model: Model<T>): RequestHandler =>
	catchAsync(async (req, res, next) => {
        const filter = req.params.tourId ? { tour: req.params.tourId } : {};
		const features = new APIFeatures(Model.find(filter), req.query as QueryParams)
			.filter()
			.sort()
			.limitFields()
			.paginate();
		const doc = await features.query;

		res.status(200).json({
			status: 'success',
			results: doc.length,
			data: {
				data: doc,
			},
		});
	});
