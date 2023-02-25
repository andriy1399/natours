import express from "express";
import { login, logout, signup, protect, forgotPassword } from "../controllers/authController";

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword)

router.use(protect);

router.get('/logout', logout);

export default router;