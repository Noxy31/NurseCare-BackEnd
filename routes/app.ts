import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import { authMiddleware } from "../middlewares/authenticate";
import { query } from "../db";

dotenv.config();

const appointmentsRouter = Router();

appointmentsRouter.get(
  "/get-appointment",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const sql = `
        SELECT 
          idApp, appDate, plannedAppTime, realAppTime, 
          isDone, idClient, idUser 
        FROM appointment
      `;
      const appointments = await query(sql);
      res.status(200).json(appointments);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error fetching appointments" });
    }
  }
);

appointmentsRouter.post(
  "/create-appointment",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { appDate, plannedAppTime, realAppTime, isDone, idClient, idUser } =
      req.body;

    try {
      const sql = `
        INSERT INTO appointment (appDate, plannedAppTime, realAppTime, isDone, idClient, idUser) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await query(sql, [
        appDate,
        plannedAppTime,
        realAppTime,
        isDone,
        idClient,
        idUser,
      ]);
      res.status(201).json({ message: "Appointment successfully created" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error creating appointment" });
    }
  }
);

appointmentsRouter.put(
  "/update-appointment",
  authMiddleware,
  async (req: Request, res: Response) => {
    const {
      idAppointment,
      appDate,
      plannedAppTime,
      realAppTime,
      isDone,
      idClient,
      idUser,
    } = req.body;

    try {
      if (!idAppointment) {
        res
          .status(400)
          .json({ error: "Appointment id is required" });
      }

      const sql = `
        UPDATE appointment 
        SET appDate = ?, plannedAppTime = ?, realAppTime = ?, isDone = ?, idClient = ?, idUser = ? 
        WHERE idAppointment = ?
      `;
      await query(sql, [
        appDate,
        plannedAppTime,
        realAppTime,
        isDone,
        idClient,
        idUser,
        idAppointment,
      ]);
      res.status(200).json({ message: "Appointment successfully updated" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error updating appointment" });
    }
  }
);

appointmentsRouter.post(
  "/delete-appointment",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { idAppointment } = req.body;

    try {
      if (!idAppointment) {
        res
          .status(400)
          .json({ error: "Appointment id is required" });
      }

      const sql = `
        DELETE FROM appointment 
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

export default appointmentsRouter;
