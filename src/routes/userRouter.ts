import express from "express";
import { login, logout, signup, protect } from "../controllers/authController";

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);


router.use(protect);

router.get('/logout', logout);

export default router;