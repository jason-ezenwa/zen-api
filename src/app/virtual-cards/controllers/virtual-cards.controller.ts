import { Request, Response } from "express";
import virtualCardsService from "../services/virtual-cards.service";
import { BadRequestError, NotFoundError } from "../../errors";
import { logEvent, validateWithSchema } from "../../../utils";
import { getUserRecordsSchema } from "../../common/dtos";

class VirtualCardsController {
  async createVirtualCard(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { currency, brand, cardPin } = req.body;

      if (!currency || !brand || !cardPin) {
        return res
          .status(400)
          .json({ error: "currency, brand and cardPin are required." });
      }

      if (currency !== "USD") {
        return res
          .status(400)
          .json({ error: "Only USD currency is supported." });
      }

      const virtualCardRequest = await virtualCardsService.createVirtualCard(
        userId,
        currency,
        brand,
        cardPin
      );

      return res.status(201).json(virtualCardRequest);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      logEvent("error", "Error creating virtual card", { error });

      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getVirtualCardsForUser(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const virtualCards = await virtualCardsService.getVirtualCardsForUser(
        userId
      );

      return res.status(200).json({ virtualCards });
    } catch (error) {
      logEvent("error", "Error getting virtual cards for user", { error });
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getVirtualCard(req: Request, res: Response) {
    try {
      const cardId = req.params.cardId;

      const virtualCard = await virtualCardsService.getVirtualCard(cardId);

      return res.status(200).json({ virtualCard });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      logEvent("error", "Error getting virtual card", { error });

      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async freezeVirtualCard(req: Request, res: Response) {
    try {
      const cardId = req.params.cardId;

      const virtualCard = await virtualCardsService.freezeVirtualCard(cardId);

      return res.status(200).json({ virtualCard });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      logEvent("error", "Error freezing virtual card", { error });

      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async unfreezeVirtualCard(req: Request, res: Response) {
    try {
      const cardId = req.params.cardId;

      const virtualCard = await virtualCardsService.unfreezeVirtualCard(cardId);

      return res.status(200).json({ virtualCard });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }

      logEvent("error", "Error unfreezing virtual card", { error });

      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async fundVirtualCard(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const cardId = req.params.cardId;

      const { amount } = req.body;

      if (!amount) {
        return res.status(400).json({ error: "amount is required." });
      }

      const success = await virtualCardsService.fundVirtualCard(
        userId,
        cardId,
        amount
      );

      return res.status(200).json({ success });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      logEvent("error", "Error funding virtual card", { error });

      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getMyVirtualCardTransactions(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const { page = 1 } = req.query;

      const dto = validateWithSchema(getUserRecordsSchema, {
        userId,
        page,
      });

      const result = await virtualCardsService.getVirtualCardTransactions(dto);

      return res.status(200).json(result);
    } catch (error) {
      logEvent("error", "Error getting virtual card transactions", { error });

      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

export default new VirtualCardsController();