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
	restrictTo,
} from '../controllers/authController';
import {
	deleteMe,
	deleteUser,
	getAllUsers,
	getMe,
	getUser,
	resizeUserPhoto,
	updateMe,
	updateUser,
	uploadUserPhoto,
} from '../controllers/userController';

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

router.use(protect); // all rotes bellow are protected

router.get('/logout', logout);
router.post('/refresh-token', refreshAccessToken);
router.patch('/update-password', updatePassword);

router.get('/me', getMe, getUser);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);

router.use(restrictTo('admin'));

router.route('/').get(getAllUsers);

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export default router;
