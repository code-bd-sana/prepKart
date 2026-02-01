import { verifyAccessToken } from "@/lib/jwt";
import mongoose from "mongoose";

export async function authenticate(request) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get("authorization");
    let token;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      // Try cookies for browser requests
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split("; ").map((c) => {
            const [key, ...val] = c.split("=");
            return [key, val.join("=")];
          }),
        );
        token = cookies.auth_token;
      }
    }

    if (!token) {
      return {
        success: false,
        error: "Authentication required",
        message: "Please login to access this resource",
        status: 401,
      };
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return {
        success: false,
        error: "Invalid or expired token",
        message: "Please login again or refresh your token",
        status: 401,
      };
    }

    let userId;
    try {
      // Check if it's already a valid ObjectId string
      if (mongoose.Types.ObjectId.isValid(decoded.userId)) {
        userId = new mongoose.Types.ObjectId(decoded.userId);
      } else {
        // If userId is not a valid ObjectId, use it as string
        userId = decoded.userId;
      }
    } catch (error) {
      console.error("Error converting userId to ObjectId:", error);
      userId = decoded.userId;
    }

    // Return user info
    return {
      success: true,
      userId: userId,
      userEmail: decoded.email,
      userTier: decoded.tier,
      userName: decoded.name || "",
      decoded,
    };
  } catch (error) {
    console.error("Auth middleware error:", error);
    return {
      success: false,
      error: "Authentication failed",
      status: 500,
    };
  }
}

/**
 * Check if user has required tier
 */
export function requireTier(userTier, requiredTier) {
  const tierLevels = {
    free: 1,
    tier2: 2,
    tier3: 3,
    admin: 999,
  };

  const userLevel = tierLevels[userTier] || 0;
  const requiredLevel = tierLevels[requiredTier] || 0;

  return userLevel >= requiredLevel;
}

/**
 * Check if user is admin
 */
export function requireAdmin(userTier) {
  return userTier === "admin";
}
