import express, { Express, Request, Response } from "express";
import authRoutes from "./routes/auth";
import codeRoutes from "./routes/code";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app: Express = express();
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: 'https://hack4-change-front-end.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.use("/auth", cors(corsOptions), authRoutes);
app.use("/code", cors(corsOptions), codeRoutes);

const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
