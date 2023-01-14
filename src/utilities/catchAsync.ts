import { RequestHandler, Request, Response, NextFunction } from 'express';

export type AsyncRequestHandler = (
	req: Request,
	res: Response,
	next: NextFunction
) => Promise<ReturnType<RequestHandler>>;

export const catchAsync = (fn: AsyncRequestHandler): RequestHandler => {
	return (req, res, next) => {
		fn(req, res, next).catch(next);
	};
};
