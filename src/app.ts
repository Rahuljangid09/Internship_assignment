import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import prisma from "./config/db";

dotenv.config();
const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/",(req,res)=>{
    res.send("Welcome to the Auth API");
});

export default app;

