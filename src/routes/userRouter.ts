import express from "express";
import { login, logout, signup, protect, forgotPassword, refreshAccessToken, resetPassword } from "../controllers/authController";

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

router.use(protect);

router.get('/logout', logout);
router.post('/refresh-token', refreshAccessToken);
export default router;