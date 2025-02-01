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


traineeRouter.post(
  "/create-trainee",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { traineeName, traineeFirstName, traineeSchool, traineeAvgGrade } = req.body;
    try {
      const sql =
        'INSERT INTO "trainee" ("traineeName", "traineeFirstName", "traineeSchool", "traineeAvgGrade") VALUES ($1, $2, $3, $4)';
      await query(sql, [traineeName, traineeFirstName, traineeSchool, traineeAvgGrade]);
      res.status(201).json({ message: "Trainee successfully created" });
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

traineeRouter.get(
  "/get-trainees",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const sql = 'SELECT "idTrainee", "traineeName", "traineeFirstName", "traineeSchool", "traineeAvgGrade" FROM "trainee"';
      const trainees = await query(sql);
      res.status(200).json(trainees);
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

traineeRouter.post(
  "/delete-trainee",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { idTrainee } = req.body;
    try {
      if (!idTrainee) {
        res.status(400).send("The ID of the trainee is required.");
      }
      const sql = 'DELETE FROM "trainee" WHERE "idTrainee" = $1';
      await query(sql, [idTrainee]);
      res.status(200).json({ message: "Stagiaire supprimé avec succès" });
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

traineeRouter.put(
  "/update-trainee",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { idTrainee, traineeName, traineeFirstName, traineeSchool, traineeAvgGrade } = req.body;
    try {
      if (!idTrainee) {
        res.status(400).send("Trainee ID is required.");
        console.log("IdTrainee not found.");
        return;
      }
      const sql =
        'UPDATE "trainee" SET "traineeName" = $1, "traineeFirstName" = $2, "traineeSchool" = $3, "traineeAvgGrade" = $4 WHERE "idTrainee" = $5';
      await query(sql, [traineeName, traineeFirstName, traineeSchool, traineeAvgGrade, idTrainee]);
      res.status(200).json({ message: "Trainee Successfully updated" });
    } catch (error) {
      console.log("Error updating trainee" + error);
      res.status(500).send(error);
    }
  }
);

traineeRouter.get('/ratings/:idTrainee', authMiddleware, async (req, res) => {
  try {
    const { idTrainee } = req.params;
   
    const ratings = await query(
      `SELECT "idApp", "ratingTicket", "commentTicket", "idTrainee"
       FROM observnote
       WHERE "idTrainee" = $1
       ORDER BY "idApp" DESC`,
      [idTrainee]
    );
   
    res.json(ratings);
  } catch (error) {
    console.error('Error fetching trainee ratings:', error);
    res.status(500).json({
      error: 'Failed to fetch trainee ratings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default traineeRouter;

