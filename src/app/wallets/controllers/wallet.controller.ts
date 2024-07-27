import { Request, Response } from 'express';
import WalletService from '../services/wallet.service';
import { BadRequestError, NotFoundError } from '../../errors';

class WalletController {
  async createWallet(req: Request, res: Response) {
    try {
      const { currency } = req.body;

      const userId = req.user.id;

      const wallet = await WalletService.createWallet(userId, currency);
      
      res.status(201).json(wallet);
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      }
      
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      }

      res.status(500).json({ error });
    }
  }

  async getWallets(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const wallet = await WalletService.getWalletsByUserId(userId);

      res.status(200).json(wallet);
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      }

      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      }

      res.status(500).json({ error });
    }
  }

  async getWallet(req: Request, res: Response) {
    try {
      const walletId = req.params.walletId;

      const wallet = await WalletService.getWalletByWalletId(walletId);

      res.status(200).json(wallet);
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      }

      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      }

      res.status(500).json({ error });
    }
  }
}

export default new WalletController();
