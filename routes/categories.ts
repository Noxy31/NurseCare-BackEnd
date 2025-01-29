import { Router, Request, Response } from "express";
import authMiddleware from "../middlewares/authenticate";
import { query } from "../db";

const categoriesRouter = Router();

categoriesRouter.get(
  "/get-categories",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const sql = 'SELECT "idCategory", "catName" FROM "category"';
      const categories = await query(sql);
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

export default categoriesRouter;