import { ErrorStatus, ErrorStatusCode } from '../types/Error';

class AppError extends Error {
	public status: ErrorStatus;
	public isOperational: boolean;
	constructor(message: string, public statusCode: ErrorStatusCode) {
		super(message);

		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
		this.isOperational = true;

		Error.captureStackTrace(this, this.constructor);
	}
}

export default AppError;
