import { Request, Response } from "express";
import prisma from "../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {sendEmail} from "../utils/sendEmail";
import { AppError } from "../utils/appError";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name,email and pass are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError("email already exists!", 409);
    }

    const hasdedPass = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hasdedPass },
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError("email and pass are required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.passwordResetOtp.create({
    data: {
      email,
      otpHash: hashedOtp,
      expiresAt,
    },
  });
  await sendEmail(email,"password reset",`<p>your OTP to reset pass is <b>${otp}</b></p>`);

  res.status(200).json({ message: "OTP sent successfully" });
};

export const resetPassword = async (req: Request, res: Response) => {
    const{email,otp,newPassword} = req.body;
    if(!email || !otp || !newPassword){
        throw new AppError("email,otp and newPassword are required",400);
    }
    const otpRecord = await prisma.passwordResetOtp.findFirst({
        where:{email,used:false,expiresAt:{gt:new Date()}},orderBy:{createdAt:'desc'}
    });
    if(!otpRecord){
        throw new AppError("Invalid or expired OTP",400);
    }
    const match = await bcrypt.compare(otp,otpRecord.otpHash);
    if(!match){
        throw new AppError("Invalid OTP",400);
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where:{email},
        data:{password:hashedPassword}
    });
    await prisma.passwordResetOtp.update({
        where:{id:otpRecord.id},
        data:{used:true}
    });
    res.status(200).json({message:"Password reset successfully"});
}
