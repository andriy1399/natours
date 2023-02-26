import express from 'express';
import {
	login,
	logout,
	signup,
	protect,
	forgotPassword,
	refreshAccessToken,
	resetPassword,
	updatePassword,
} from '../controllers/authController';

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password', resetPassword);

router.use(protect); // all rotes bellow are protected

router.get('/logout', logout);
router.post('/refresh-token', refreshAccessToken);
router.patch('/update-password', updatePassword);

export default router;
