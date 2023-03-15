import { RequestHandler, Request, Response, NextFunction } from 'express';

export type AsyncRequestHandler<T extends Request> = (
	req: T,
	res: Response,
	next: NextFunction
) => Promise<ReturnType<RequestHandler>>;

export const catchAsync = <T extends Request>(fn: AsyncRequestHandler<T>) => {
	return (req: T, res: Response, next: NextFunction) => {
		fn(req, res, next).catch(next);
	};
};
