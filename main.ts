import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";


const server = express();

server.use(cookieParser());
server.use(express.json());

server.use("/users", authRouter);
server.use('/users', usersRouter);




server.listen(3000, () => console.log("444 Serveur démarré 444"));