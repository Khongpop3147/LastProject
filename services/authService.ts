// services/authService.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userModel from "../models/userModel";
import type { User } from "@prisma/client";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET in environment");
  }
  return secret;
}

/**
 * ตรวจสอบความแข็งแรงของรหัสผ่าน
 * - ความยาวขั้นต่ำ 8 ตัวอักษร
 */
function validatePassword(password: string): void {
  if (!password || typeof password !== "string") {
    throw new Error("กรุณากรอกรหัสผ่าน");
  }
  if (password.length < 8) {
    throw new Error("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
  }
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<Omit<User, "passwordHash">> {
  validatePassword(password);
  const existing = await userModel.findUserByEmail(email);
  if (existing) throw new Error("Email already registered");
  const hash = await bcrypt.hash(password, 10);
  const user = await userModel.createUser({ name, email, passwordHash: hash });
  // omit passwordHash
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function login(
  email: string,
  password: string
): Promise<{ user: Omit<User, "passwordHash"> }> {
  const user = await userModel.findUserByEmail(email);
  if (!user) throw new Error("Invalid credentials");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");
  const { passwordHash, ...safeUser } = user;
  return { user: safeUser };
}

/**
 * สร้าง JWT token สำหรับ user
 */
export function createToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "7d" });
}
