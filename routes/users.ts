import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import { authMiddleware, CustomRequest } from "../middlewares/authenticate";
import bcrypt from "bcrypt";
import { query } from "../db";
dotenv.config();

const usersRouter = Router();

usersRouter.post(
  "/create-user",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { userName, userMail, userPass, userRole } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(userPass, 10);
      const sql =
        'INSERT INTO "users" ("userName", "userMail", "userPass", "userRole") VALUES ($1, $2, $3, $4)';
      await query(sql, [userName, userMail, hashedPassword, userRole]);
      res.status(201).json({ message: "User successfully created" });
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

usersRouter.get(
  "/get-users",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const sql = 'SELECT "idUser", "userName", "userMail", "userRole" FROM "users"';
      const users = await query(sql);
      res.status(200).json(users);
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

usersRouter.post(
  "/delete-users",
  authMiddleware,
  async (req: CustomRequest, res: Response) => {
    const { idUser } = req.body;
    try {
      if (!idUser) {
        res.status(400).send("L'identifiant de l'utilisateur est requis.");
      }
      const sql = 'DELETE FROM "users" WHERE "idUser" = $1';
      await query(sql, [idUser]);
      res.status(200).json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

usersRouter.put(
  "/update-user",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { idUser, userName, userMail, userRole } = req.body;
    try {
      if (!idUser) {
        res.status(400).send("User ID is required.");
        console.log("IdUser not found.");
        return;
      }
      const sql =
        'UPDATE "users" SET "userName" = $1, "userMail" = $2, "userRole" = $3 WHERE "idUser" = $4';
      await query(sql, [userName, userMail, userRole, idUser]);
      res.status(200).json({ message: "User Successfully updated" });
    } catch (error) {
      console.log("Error updating user" + error);
      res.status(500).send(error);
    }
  }
);

usersRouter.get(
  "/get-nurses",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const sql = 'SELECT "idUser", "userName" FROM "users" WHERE "userRole" = $1';
      const nurses = await query(sql, [3]);
      res.status(200).json(nurses);
    } catch (error) {
      console.error("Error fetching nurses:", error);
      res.status(500).send(error);
    }
  }
);

export default usersRouter;
