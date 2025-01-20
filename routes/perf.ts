import { Router, Request, Response } from "express";
import authMiddleware from "../middlewares/authenticate";
import { query } from "../db";

const perfRouter = Router();

perfRouter.get(
  "/categories",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const sql = 'SELECT "idCat", "catName" FROM "categories"';
      const categories = await query(sql);
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

perfRouter.get(
  "/by-category/:idCat",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { idCat } = req.params;
    try {
      const sql = 'SELECT "idPerf", "perfName", "perfPrice", "idCat" FROM "performances" WHERE "idCat" = $1';
      const performances = await query(sql, [idCat]);
      res.status(200).json(performances);
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

perfRouter.post(
  "/save-appointment",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { idApp, idPerf, hasTrainee, idTrainee } = req.body;
    try {
      // Begin transaction
      await query('BEGIN');

      // Update appointment with performance
      const updateAppSql = `
        UPDATE "appointments"
        SET "idPerf" = $1, "realAppTime" = CURRENT_TIME
        WHERE "idApp" = $2
      `;
      await query(updateAppSql, [idPerf, idApp]);

      // Handle trainee information
      if (hasTrainee && idTrainee) {
        const traineeCheckSql = `
          SELECT * FROM "observnote"
          WHERE "observnote_idapp_fkey" = $1
        `;
        const existingTrainee = await query(traineeCheckSql, [idApp]);

        if (existingTrainee.length === 0) {
          const insertTraineeSql = `
            INSERT INTO "observnote" ("observnote_idapp_fkey", "observnote_idtrainee_fkey")
            VALUES ($1, $2)
          `;
          await query(insertTraineeSql, [idApp, idTrainee]);
        } else {
          const updateTraineeSql = `
            UPDATE "observnote"
            SET "observnote_idtrainee_fkey" = $1
            WHERE "observnote_idapp_fkey" = $2
          `;
          await query(updateTraineeSql, [idTrainee, idApp]);
        }
      } else {
        // Remove trainee association if exists
        const deleteTraineeSql = `
          DELETE FROM "observnote"
          WHERE "observnote_idapp_fkey" = $1
        `;
        await query(deleteTraineeSql, [idApp]);
      }

      // Commit transaction
      await query('COMMIT');
      
      res.status(200).json({ message: "Appointment details saved successfully" });
    } catch (error) {
      // Rollback in case of error
      await query('ROLLBACK');
      res.status(500).json({ error: "Error saving appointment details" });
    }
  }
);

export default perfRouter;