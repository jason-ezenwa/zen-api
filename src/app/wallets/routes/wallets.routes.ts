import { Router } from 'express';
import WalletController from '../controllers/wallet.controller';
import { authenticate } from '../../authentication/middlewares/auth.middleware';

const router = Router();

router.post("/", authenticate, WalletController.createWallet);
router.get("/", authenticate, WalletController.getWallets);
router.get("/my-deposits", authenticate, WalletController.getMyDeposits);
router.get("/:walletId", authenticate, WalletController.getWallet);
router.post("/fund", authenticate, WalletController.fundWallet);

export default router;
