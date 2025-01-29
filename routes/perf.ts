import { Router, Request, Response } from "express";
import authMiddleware from "../middlewares/authenticate";
import { query } from "../db";

const perfRouter = Router();

perfRouter.get(
  "/by-category/:idCategory",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { idCategory } = req.params;
    try {
      console.log("Starting request for category:", idCategory);
      console.log("Type of idCategory:", typeof idCategory);

      const sql =
        'SELECT "idPerf", "perfName", "perfPrice", "idCategory" FROM "performance" WHERE "idCategory" = $1';
      console.log("SQL Query:", sql);
      console.log("Parameters:", [idCategory]);

      const performances = await query(sql, [idCategory]);
      console.log("Query executed successfully. Results:", performance);

      res.status(200).json(performances);
    } catch (error: any) {
      console.error("Full error object:", error);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error stack:", error.stack);

      res.status(500).json({
        error: "Database error",
        details: error.message,
      });
    }
  }
);

perfRouter.post(
  "/save-appointment",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const { idApp, performances, hasTrainee, idTrainee } = req.body;

    try {
      if (!Array.isArray(performances)) {
        res.status(400).json({
          error: "Invalid input",
          details: "performances must be an array",
        });
        return;
      }
      await query("BEGIN");

      // Mise à jour du rendez-vous
      const updateAppointmentSql = `
        UPDATE "appointment"
        SET "isDone" = true
        WHERE "idApp" = $1
      `;
      await query(updateAppointmentSql, [idApp]);

      // Calcul du montant total
      const performancePrices = await query(
        'SELECT "perfPrice" FROM "performance" WHERE "idPerf" = ANY($1)',
        [performances.map((p) => p.idPerf)]
      );

      const totalAmount = performancePrices.rows
        .reduce(
          (sum: number, row: { perfPrice: string }) =>
            sum + parseFloat(row.perfPrice),
          0
        )
        .toFixed(2);

      // Création de la facture
      const createBillSql = `
        INSERT INTO "bill" ("billStatus", "totalAmount", "idApp")
        VALUES ($1, $2, $3)
        RETURNING "idBill"
      `;
      const billResult = await query(createBillSql, [
        "pending",
        totalAmount,
        idApp,
      ]);

      // Vérifier si billResult est défini et a des lignes
      if (!billResult || !billResult.rows || !billResult.rows[0]) {
        throw new Error("Failed to create bill");
      }

      const idBill = billResult.rows[0].idBill;

      // Suppression des anciennes performances
      const deleteOldImpliesSql = `
        DELETE FROM "implies"
        WHERE "idApp" = $1
      `;
      await query(deleteOldImpliesSql, [idApp]);

      // Insertion des nouvelles performances
      const insertImpliesSql = `
        INSERT INTO "implies" ("idApp", "idPerf")
        VALUES ($1, $2)
      `;

      for (const perf of performances) {
        await query(insertImpliesSql, [idApp, perf.idPerf]);
      }

      // Gestion du stagiaire (reste identique)
      if (hasTrainee && idTrainee) {
        const traineeCheckSql = `
          SELECT * FROM "observnote"
          WHERE "idApp" = $1
        `;
        const existingTrainee = await query(traineeCheckSql, [idApp]);

        if (existingTrainee.rows.length === 0) {
          const insertTraineeSql = `
            INSERT INTO "observnote" ("idApp", "idTrainee")
            VALUES ($1, $2)
          `;
          await query(insertTraineeSql, [idApp, idTrainee]);
        } else {
          const updateTraineeSql = `
            UPDATE "observnote"
            SET "idTrainee" = $1
            WHERE "idApp" = $2
          `;
          await query(updateTraineeSql, [idTrainee, idApp]);
        }
      } else {
        const deleteTraineeSql = `
          DELETE FROM "observnote"
          WHERE "idApp" = $1
        `;
        await query(deleteTraineeSql, [idApp]);
      }

      await query("COMMIT");
      res.status(200).json({
        message: "Appointment details saved successfully",
        idBill: idBill,
      });
    } catch (error: any) {
      await query("ROLLBACK");
      console.error("Database error:", error);
      res.status(500).json({
        error: "Database error",
        details: error.message,
      });
    }
  }
);

export default perfRouter;
