import { Router } from 'express';
import AuthController from '../controllers/auth.controller';

const router = Router();

// Bind ensures the correct 'this' context
router.post('/register', AuthController.register.bind(AuthController));
router.post('/login', AuthController.login.bind(AuthController));

export default router;
