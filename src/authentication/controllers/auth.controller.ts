import { Request, Response } from 'express';
import AuthService from '../services/auth.service';

class AuthController {
  public async register(req: Request, res: Response) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error });
    }
  }

  public async login(req: Request, res: Response) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error });
    }
  }
}

export default new AuthController();
