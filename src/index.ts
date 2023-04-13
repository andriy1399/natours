import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import AppError from './utilities/AppError';
import errorController from './controllers/errorController';
import mongoSanitize from 'express-mongo-sanitize';
import userRouter from './routes/userRouter';
import tourRouter from './routes/tourRoutes';
import reviewRouter from './routes/reviewRoute';
const app = express();

app.use(cookieParser());
app.enable('trust proxy');
app.set('view engine', 'pug');
app.set('email-templates', path.join(__dirname, 'email-templates'));

// 1) GLOBAL MIDDLEWARES
// // Implement CORS
app.use(cors());
// // Access-Control-Allow-Origin *
// // api.natours.com, front-end natours.com
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

// app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
)

// Development logging
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
	max: 1000,
	windowMs: 60 * 60 * 1000,
	message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Stripe webhook, BEFORE body-parser, because stripe needs the body as stream
// app.post(
//   '/webhook-checkout',
//   bodyParser.raw({ type: 'application/json' }),
//   bookingController.webhookCheckout
// );

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(
	hpp({
		whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'],
	})
);

// app.use(compression());

// Test middleware
app.use((req, res, next) => {
	console.log(new Date().toISOString());
	// console.log(req.cookies);
	next();
});

// 3) ROUTES

// app.use('/api/v1/tours', tourRouter);
// app.use('/api/v1/users', userRouter);
// app.use('/api/v1/reviews', reviewRouter);
// app.use('/api/v1/bookings', bookingRouter);



app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/img', express.static(path.join(`${__dirname}/../, 'dev-data/img'`)));
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorController);

export default app;
