import { Router, Request, Response } from "express";
import { query } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

const authRouter = Router();
authRouter.use(cookieParser());

authRouter.post("/login", async (req: Request, res: Response): Promise<any> => {
  console.log("Login endpoint hit");
  const { email, password } = req.body;
  console.log(email);

  try {
    const sql = "SELECT * FROM users WHERE userMail = ?";
    const users = await query(sql, [email]);

    if (users.length === 0) {
      return res
        .status(404)
        .json({
          message:
            "User not found. Please try again or contact your administrator.",
        });
    }

    const user = users[0];

    const match = await bcrypt.compare(password, user.userPass);

    if (!match) {
      return res
        .status(401)
        .json({
          message:
            "Incorrect password. Please try again or contact your administrator.",
        });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET non défini");
      return res
        .status(500)
        .json({ message: "Erreur de configuration du serveur" });
    }

    const token = jwt.sign(
      {
        id: user.idUser,
        email: user.userMail,
        isAdmin: user.userRole,
        name: user.userName,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Connexion successful",
      token,
      user: {
        id: user.idUser,
        email: user.userMail,
        userName: user.userName,
        isAdmin: user.userRole,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).send(error);
  }
});

authRouter.get("/me", async (req: Request, res: Response): Promise<any> => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const jwtSecret = process.env.JWT_SECRET as string;

    const decodedToken = jwt.verify(token, jwtSecret) as { name: string };
    res.status(200).json({ name: decodedToken.name });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

export default authRouter;
