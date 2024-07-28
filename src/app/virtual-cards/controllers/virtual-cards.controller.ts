import { Request, Response } from "express";
import virtualCardsService from "../services/virtual-cards.service";

class VirtualCardsController {
  async createVirtualCard(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { currency, brand, cardPin } = req.body;

      if (!currency || !brand || !cardPin) {
        return res.status(400).json({ error: "currency, brand and cardPin are required." });
      }

      const virtualCardRequest = await virtualCardsService.createVirtualCard(userId, currency, brand, cardPin);

      return res.status(201).json(virtualCardRequest);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

export default new VirtualCardsController();