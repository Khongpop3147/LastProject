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

export async function register(
  name: string,
  email: string,
  password: string
): Promise<Omit<User, "passwordHash">> {
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
): Promise<{ user: Omit<User, "passwordHash">; token: string }> {
  const user = await userModel.findUserByEmail(email);
  if (!user) throw new Error("Invalid credentials");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");
  const token = jwt.sign({ userId: user.id }, getJwtSecret(), {
    expiresIn: "7d",
  });
  const { passwordHash, ...safeUser } = user;
  return { user: safeUser, token };
}
