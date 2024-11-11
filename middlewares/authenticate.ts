// Sécurise les routes en obligeant la présence d'un token pour pouvoir les soumettre

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
export interface CustomRequest extends Request {
  user?: { id: number, email: string, isAdmin: boolean, userName: string };
}

export const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  const token = req.cookies['token'];
  
  if (!token) {
    res.status(401).json({ message: 'Accès non autorisé, token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const user: { id: number, email: string, isAdmin: boolean, userName: string } = {
      id: decoded.id,
      email: decoded.email,
      isAdmin: decoded.isAdmin,
      userName: decoded.userName
    };
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

export default authMiddleware;