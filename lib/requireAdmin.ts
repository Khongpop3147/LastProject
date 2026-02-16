import type { User } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getUserFromToken } from "@/lib/auth";

type AuthResult = {
  user: User | null;
  errorSent: boolean;
};

export async function getRequestUser(
  req: NextApiRequest
): Promise<User | null> {
  const bearer =
    typeof req.headers.authorization === "string"
      ? req.headers.authorization
      : undefined;
  const token = req.cookies.token || bearer;
  return getUserFromToken(token);
}

export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthResult> {
  const user = await getRequestUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return { user: null, errorSent: true };
  }
  if (user.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return { user: null, errorSent: true };
  }
  return { user, errorSent: false };
}
