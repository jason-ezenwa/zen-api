import { Router } from "express";
import UsersController from "./controllers/users.controller";
import { authenticate } from "../authentication/middlewares/auth.middleware";

const router = Router();

// Bind ensures the correct 'this' context
router.get("/me", authenticate, UsersController.me.bind(UsersController));

export default router;
