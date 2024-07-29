import express,{ Express,Request,Response } from "express";
import authRoutes from "./routes/auth";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app:Express=express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials:true,
  origin:["http://localhost:3000"],
}));


app.use("/auth",authRoutes);

const port=process.env.PORT || 3002;

app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
})
