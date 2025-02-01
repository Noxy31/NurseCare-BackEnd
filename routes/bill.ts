import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/authenticate";
import { query } from "../db";

interface CustomRequest extends Request {
  user?: {
    id: number;
    email: string;
    isAdmin: boolean;
    userName: string;
  };
}

const billRouter = Router();
//Route bills pour Secretary
billRouter.get(
  "/get-all-bills",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const sql = `
        SELECT 
          b."idBill",
          b."billStatus",
          b."totalAmount",
          a."appDate",
          c."clientName"
        FROM "bill" b
        JOIN "appointment" a ON b."idApp" = a."idApp"
        JOIN "clients" c ON a."idClient" = c."idClient"
        ORDER BY a."appDate" DESC
      `;
      
      const bills = await query(sql);
      console.log('Bills found:', bills.length);
      
      res.status(200).json(bills);
    } catch (error) {
      console.error('Error in get-all-bills:', error);
      res.status(500).json({ error: "Error fetching bills" });
    }
  }
);

billRouter.put(
  "/update-bill",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { idBill, billStatus, totalAmount } = req.body;

    try {
      const sql = `
        UPDATE "bill"
        SET "billStatus" = $1, "totalAmount" = $2
        WHERE "idBill" = $3
      `;
      await query(sql, [billStatus, totalAmount, idBill]);
      res.status(200).json({ message: "Bill successfully updated" });
    } catch (error) {
      res.status(500).json({ error: "Error updating bill" });
    }
  }
);

billRouter.delete(
  "/delete-bill/:idBill",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { idBill } = req.params;

    try {
      const sql = `DELETE FROM "bill" WHERE "idBill" = $1`;
      await query(sql, [idBill]);
      res.status(200).json({ message: "Bill successfully deleted" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting bill" });
    }
  }
);


// Route bills pour Nurses
billRouter.get(
  "/get-bills",
  authMiddleware,
  async (req: CustomRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const sql = `
        SELECT
          b."idBill",
          b."billStatus",
          b."totalAmount",
          b."idApp",
          a."appDate",
          a."foresAppTime",
          a."realAppTime",
          c."idClient",
          c."clientName",
          c."clientAddress",
          c."clientPhone",
          c."clientMail"
        FROM "bill" b
        JOIN "appointment" a ON b."idApp" = a."idApp"
        JOIN "clients" c ON a."idClient" = c."idClient"
        WHERE a."idUser" = $1
        ORDER BY a."appDate" DESC, a."foresAppTime" DESC
      `;
      
      const bills = await query(sql, [req.user.id]);
      console.log('Bills found:', bills.length);
      
      res.status(200).json(bills);
    } catch (error) {
      console.error('Error in get-bills:', error);
      res.status(500).json({ error: "Error fetching bills" });
    }
  }
);

billRouter.post(
  "/create-bill",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { billStatus, totalAmount, idApp } = req.body;

    try {
      const sql = `
        INSERT INTO "bill" ("billStatus", "totalAmount", "idApp")
        VALUES ($1, $2, $3)
        RETURNING "idBill"
      `;
      const result = await query(sql, [billStatus, totalAmount, idApp]);
      res.status(201).json({ 
        message: "Bill successfully created",
        idBill: result[0].idBill
      });
    } catch (error) {
      res.status(500).json({ error: "Error creating bill" });
    }
  }
);

export default billRouter;