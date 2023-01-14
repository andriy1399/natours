import { NextFunction, Request, Response } from 'express';
import { N } from 'ts-toolbelt';
import AppError from '../utilities/AppError';

export type ErrorStatus = 'fail' | 'error';
export type ErrorStatusCode = number;

export type ErrorController = (err: AppError, req: Request, res: Response, next: NextFunction) => void