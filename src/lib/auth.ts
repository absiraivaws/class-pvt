import { SignJWT, jwtVerify } from "jose";

export type SessionUser = {
  sub: string;
  type: "student" | "admin";
  role?: "ADMIN" | "FINANCE";
};

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-secret-change-me"
);

export const SESSION_COOKIE = "sp_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ type: user.type, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      type: (payload.type as SessionUser["type"]) || "student",
      role: payload.role as SessionUser["role"],
    };
  } catch {
    return null;
  }
}

export const SESSION_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
