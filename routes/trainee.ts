// trainee.ts
import { Router, Request, Response } from "express";
import authMiddleware from "../middlewares/authenticate";
import { query } from "../db";

const traineeRouter = Router();

traineeRouter.get(
  "/all",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const sql = 'SELECT "idTrainee", "traineeName", "traineeFirstName", "traineeSchool" FROM "trainee"';
      const trainees = await query(sql);
      res.status(200).json(trainees);
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

traineeRouter.get(
  "/check-presence/:idApp",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { idApp } = req.params;
    try {
      const sql = `
        SELECT t."idTrainee", t."traineeName", t."traineeFirstName"
        FROM "observnote" o
        JOIN "trainee" t ON t."idTrainee" = o."observnote_idtrainee_fkey"
        WHERE o."observnote_idapp_fkey" = $1
      `;
      const result = await query(sql, [idApp]);
      
      if (result.length > 0) {
        res.status(200).json({
          present: true,
          traineeId: result[0].idTrainee,
          traineeName: result[0].traineeName,
          traineeFirstName: result[0].traineeFirstName
        });
      } else {
        res.status(200).json({ present: false });
      }
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

traineeRouter.post(
  "/create",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { traineeName, traineeFirstName, traineeSchool } = req.body;
    try {
      const sql = `
        INSERT INTO "trainee" ("traineeName", "traineeFirstName", "traineeSchool")
        VALUES ($1, $2, $3)
        RETURNING "idTrainee"
      `;
      const result = await query(sql, [traineeName, traineeFirstName, traineeSchool]);
      res.status(201).json({ 
        message: "Trainee successfully created",
        idTrainee: result[0].idTrainee
      });
    } catch (error) {
      res.status(500).json({ error: "Error creating trainee" });
    }
  }
);

export default traineeRouter;