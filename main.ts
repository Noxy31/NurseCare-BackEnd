import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import clientRouter from "./routes/clients";
import appointmentsRouter from "./routes/app";
import billRouter from "./routes/bill";
import traineeRouter from "./routes/trainee";
import perfRouter from "./routes/perf";


const server = express();

server.use(cookieParser());
server.use(express.json());

server.use("/users", authRouter);
server.use('/users', usersRouter);
server.use('/client', clientRouter);
server.use('/appointment', appointmentsRouter);
server.use('/bill', billRouter);
server.use('/trainee', traineeRouter);
server.use('/perf', perfRouter);




server.listen(3000, () => console.log("444 Serveur démarré 444"));