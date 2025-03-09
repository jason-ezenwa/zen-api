import { Router } from "express";
import VirtualCardsController from "./controllers/virtual-cards.controller";
import { authenticate } from "../authentication/middlewares/auth.middleware";

const router = Router();

// Bind ensures the correct 'this' context
router.post(
	"/",
	authenticate,
	VirtualCardsController.createVirtualCard.bind(VirtualCardsController)
);

router.get(
	"/",
	authenticate,
	VirtualCardsController.getVirtualCardsForUser.bind(VirtualCardsController)
);

router.get(
	"/:cardId",
	authenticate,
	VirtualCardsController.getVirtualCard.bind(VirtualCardsController)
);

router.patch(
	"/:cardId/freeze",
	authenticate,
	VirtualCardsController.freezeVirtualCard.bind(VirtualCardsController)
);

router.patch(
	"/:cardId/unfreeze",
	authenticate,
	VirtualCardsController.unfreezeVirtualCard.bind(VirtualCardsController)
);

router.post(
	"/:cardId/fund",
	authenticate,
	VirtualCardsController.fundVirtualCard.bind(VirtualCardsController)
);

export default router;
