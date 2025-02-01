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
    const { 
      idApp, 
      performances, 
      hasTrainee, 
      idTrainee, 
      traineeGrade, 
      traineeComment 
    } = req.body;

    try {
      if (!Array.isArray(performances)) {
        res.status(400).json({
          error: "Invalid input",
          details: "performances must be an array",
        });
        return;
      }

      console.log("Received data:", { 
        performances, 
        hasTrainee, 
        idTrainee, 
        traineeGrade, 
        traineeComment 
      });

      await query("BEGIN");

      // Mise a jour du rdv
      const updateAppointmentSql = `
        UPDATE "appointment"
        SET "isDone" = true
        WHERE "idApp" = $1
      `;
      await query(updateAppointmentSql, [idApp]);

      // Calcul du montant total de la facture
      const totalAmount = performances
        .reduce(
          (sum: number, perf: { perfPrice: number }) => sum + perf.perfPrice,
          0
        )
        .toFixed(2);

      console.log("Calculated total:", totalAmount);

      // Creation de la facture
      const createBillSql = `
        INSERT INTO "bill" ("billStatus", "totalAmount", "idApp")
        VALUES ($1, $2, $3)
        RETURNING "idBill"
      `;
      const billResults = await query(createBillSql, [
        "pending",
        totalAmount,
        idApp,
      ]);

      if (!billResults || billResults.length === 0) {
        throw new Error('Failed to create bill');
      }
      
      const idBill = billResults[0].idBill;
      console.log("Created bill with ID:", idBill);

      // Suppression des anciennes prestations
      const deleteOldImpliesSql = `
        DELETE FROM "implies"
        WHERE "idApp" = $1
      `;
      await query(deleteOldImpliesSql, [idApp]);

      // Insertion des nouvelles prestations
      const insertImpliesSql = `
        INSERT INTO "implies" ("idApp", "idPerf")
        VALUES ($1, $2)
      `;

      for (const perf of performances) {
        await query(insertImpliesSql, [idApp, perf.idPerf]);
      }

      // Gestion de l'observation du stagiaire
      if (hasTrainee && idTrainee) {
        // Validate la note si fournis et entre 0 et 20
        if (traineeGrade !== null && (traineeGrade < 0 || traineeGrade > 20)) {
          throw new Error('Invalid grade: must be between 0 and 20');
        }

        // Vérfie si une note existe déjà pour ce stagiaire
        const traineeCheckSql = `
          SELECT COUNT(*) as count
          FROM "observnote"
          WHERE "idApp" = $1
        `;
        const existingTraineeResult = await query(traineeCheckSql, [idApp]);
        const existingCount = parseInt(existingTraineeResult[0]?.count || '0');

        if (existingCount === 0) {
          // Insert une nouvelle observation
          const insertTraineeSql = `
            INSERT INTO "observnote" 
            ("idApp", "idTrainee", "ratingTicket", "commentTicket")
            VALUES ($1, $2, $3, $4)
          `;
          await query(insertTraineeSql, [
            idApp,
            idTrainee,
            traineeGrade,
            traineeComment
          ]);
          console.log("Inserted new trainee observation");
        } else {
          // Met a jour l'observation existante
          const updateTraineeSql = `
            UPDATE "observnote"
            SET 
              "idTrainee" = $1,
              "ratingTicket" = $2,
              "commentTicket" = $3
            WHERE "idApp" = $4
          `;
          await query(updateTraineeSql, [
            idTrainee,
            traineeGrade,
            traineeComment,
            idApp
          ]);
          console.log("Updated existing trainee observation");
        }

        // Mise a jour de la note moyenne du stagiaire dans la table trainee
        const updateAvgGradeSql = `
          WITH avg_grade AS (
            SELECT AVG(CAST("ratingTicket" AS FLOAT)) as average
            FROM "observnote"
            WHERE "idTrainee" = $1
            AND "ratingTicket" IS NOT NULL
          )
          UPDATE "trainee"
          SET "traineeAvgGrade" = ROUND((SELECT average FROM avg_grade)::numeric, 2)
          WHERE "idTrainee" = $1
        `;
        await query(updateAvgGradeSql, [idTrainee]);
        console.log("Updated trainee average grade");
      } else {
        // Si pas de stagiaire, supprime l'observation existante
        const deleteTraineeSql = `
          DELETE FROM "observnote"
          WHERE "idApp" = $1
        `;
        await query(deleteTraineeSql, [idApp]);
        console.log("Deleted trainee observation");
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
        stack: error.stack,
      });
    }
  }
);

export default perfRouter;
