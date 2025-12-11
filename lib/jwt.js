import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-for-development-only";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || JWT_SECRET + "_refresh";

// Generate access token (1 hour )
export function generateAccessToken(userId, email, tier, name) {
  return jwt.sign(
    { userId, email, tier, name, type: "access" },
    JWT_SECRET,
    { expiresIn: "7d" } // Changed from '1h' to '7d'
  );
}

// Generate refresh token (7 days)
export function generateRefreshToken(userId) {
  return jwt.sign(
    { userId, type: "refresh" },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" } // 7 days refresh token
  );
}

// Verify access token
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Access token verification failed:", error.message);
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    console.error("Refresh token verification failed:", error.message);
    return null;
  }
}
