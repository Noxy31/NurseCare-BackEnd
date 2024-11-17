import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import authMiddleware from "../middlewares/authenticate";
// import isAdminMiddleware from "../middlewares/isadmin";
import { CustomRequest } from "../middlewares/authenticate";
import { query } from "../db";

dotenv.config();

const clientRouter = Router();

clientRouter.post("/create-client", async (req: Request, res: Response) => {
  const { customerName, customerAddress, customerPhone, customerMail } =
    req.body;

  try {
    const sql =
      "INSERT INTO customer (customerName, customerAddress, customerPhone, customerMail) VALUES (?, ?, ?, ?)";
    await query(sql, [
      customerName,
      customerAddress,
      customerPhone,
      customerMail,
    ]);

    res.status(201).json({ message: " 44 Client successfully created" });
  } catch (error) {
    res.status(500).send(error);
  }
});

clientRouter.get(
  "/get-client",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const sql =
        "SELECT idCustomer, customerName, customerAddress, customerPhone, customerMail FROM customer";
      const customers = await query(sql);

      res.status(200).json(customers);
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

clientRouter.post(
  "/delete-client",
  authMiddleware,
  async (req: CustomRequest, res: Response) => {
    const { idCustomer } = req.body;

    try {
      if (!idCustomer) {
        res.status(400).send(" 44 Client ID required");
      }

      const sql = "DELETE FROM customer WHERE idCustomer = ?";
      await query(sql, [idCustomer]);

      res.status(200).json({ message: " 44 Client successfully deleted" });
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

clientRouter.put(
  "/update-client",
  authMiddleware,
  async (req: Request, res: Response) => {
    const {
      idCustomer,
      customerName,
      customerAddress,
      customerPhone,
      customerMail,
    } = req.body;

    try {
      if (!idCustomer) {
        res.status(400).send(" 44 CLient id required");
      }

      const sql =
        "UPDATE customer SET customerName = ?, customerAddress = ?, customerPhone = ?, customerMail = ? WHERE idCustomer = ?";
      await query(sql, [
        customerName,
        customerAddress,
        customerPhone,
        customerMail,
        idCustomer,
      ]);

      res.status(200).json({ message: "44 Client successfully updated" });
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

export default clientRouter;