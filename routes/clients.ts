import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import authMiddleware from "../middlewares/authenticate";
// import isAdminMiddleware from "../middlewares/isadmin";
import { CustomRequest } from "../middlewares/authenticate";
import { query } from "../db";

dotenv.config();

const clientRouter = Router();

// Route pour suggestions
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

clientRouter.post(
  "/create-client",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { clientName, clientAddress, clientPhone, clientMail } = req.body;

    try {
      const sql = `
          INSERT INTO clients (clientName, clientAddress, clientPhone, clientMail) 
          VALUES (?, ?, ?, ?)
        `;
      await query(sql, [clientName, clientAddress, clientPhone, clientMail]);
      res.status(201).json({ message: "Patient successfully created" });
    } catch (error) {
      res.status(500).json({ error: "Error creating patient" });
    }
  }
);

clientRouter.put(
  "/update-client",
  authMiddleware,
  async (req: Request, res: Response) => {
    const {
      idClient,
      clientName,
      clientAddress,
      clientPhone,
      clientMail
    } = req.body;

    try {
      if (!idClient) {
        res.status(400).json({ error: "Appointment id is required" });
      }

      const sql = `
          UPDATE clients 
          SET clientName = ?, clientAddress = ?, clientPhone = ?, clientMail = ?, idClient = ?, idUser = ? 
          WHERE idAppointment = ?
        `;
      await query(sql, [
        clientName,
        clientAddress,
        clientPhone,
        clientMail,
        idClient,
      ]);
      res.status(200).json({ message: "Client successfully updated" });
    } catch (error) {
      res.status(500).json({ error: "Error updating client" });
    }
  }
);

clientRouter.post(
    "/delete-client",
    authMiddleware,
    async (req: Request, res: Response) => {
      const { idAppointment } = req.body;
  
      try {
        if (!idAppointment) {
          res
            .status(400)
            .json({ error: "Client id is required" });
        }
  
        const sql = `
          DELETE FROM clients 
          WHERE idAppointment = ?
        `;
        await query(sql, [idAppointment]);
        res.status(200).json({ message: "Appointment successfully deleted" });
      } catch (error) {
        res
          .status(500)
          .json({ error: "Error deleting appointment" });
      }
    }
  );

export default clientRouter;
