import { Request, Response } from 'express';
import WalletService from '../services/wallet.service';
import { BadRequestError, NotFoundError } from '../../errors';
import { validateWithSchema } from "../../../utils";
import { depositFundsSchema } from "../dto/deposit-funds.dto";
import { getWalletSchema } from "../dto/wallet.dto";
import { getUserRecordsSchema } from "../../common/dtos";

class WalletController {
  async createWallet(req: Request, res: Response) {
    try {
      const { currency } = req.body;

      const userId = req.user.id;

      const wallet = await WalletService.createWallet(userId, currency);

      return res.status(201).json(wallet);
    } catch (error) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message });
      }

      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error });
    }
  }

  async getWallets(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const wallets = await WalletService.getWalletsByUserId(userId);

      return res.status(200).json({ wallets });
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      return res.status(500).json({ error });
    }
  }

  async getWallet(req: Request, res: Response) {
    try {
      const dto = validateWithSchema(getWalletSchema, req.params);

      const wallet = await WalletService.getWalletByWalletId(dto.walletId);

      return res.status(200).json({ wallet });
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      return res.status(500).json({ error });
    }
  }

  async fundWallet(req: Request, res: Response) {
    try {
      const dto = validateWithSchema(depositFundsSchema, req.body);

      const { paymentLink, depositId } = await WalletService.fundWallet(dto);

      return res
        .status(200)
        .json({ message: "Initialising deposit", paymentLink, depositId });
    } catch (error) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message });
      }

      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error });
    }
  }

  async getMyDeposits(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const { page = 1 } = req.query;

      console.log({ page, userId });

      const dto = validateWithSchema(getUserRecordsSchema, {
        userId,
        page,
      });

      const result = await WalletService.getUserDeposits(dto);

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

export default new WalletController();
