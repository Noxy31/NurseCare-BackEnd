import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import authMiddleware from "../middlewares/authenticate";
// import isAdminMiddleware from "../middlewares/isadmin";
import { CustomRequest } from "../middlewares/authenticate";
import { query } from "../db";

dotenv.config();

const clientRouter = Router();

clientRouter.get(
    "/get-client-names",
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const sql = "SELECT idClient, clientName FROM clients";
        const clients = await query(sql);
        res.status(200).json(clients);
      } catch (error) {
        res.status(500).send(error);
      }
    }
  );

export default clientRouter;