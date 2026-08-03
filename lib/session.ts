import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "auth_token";

function getJwtSecretKey(): Uint8Array {
  const secret =
    process.env.JWT_SECRET || "creative-line-graphics-secret-key-2026-ay9344216902";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: {
  id: string;
  email: string;
  name: string;
  role?: string;
}) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecretKey());

  return token;
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as {
      id: string;
      email: string;
      name: string;
      role?: string;
    };
  } catch {
    return null;
  }
}
