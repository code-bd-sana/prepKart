import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: "/api",
});

// Add token to requests (client-side only)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Helper function to save auth data to localStorage (client-side only)
const saveAuthData = (user, token) => {
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem("token", token);
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }
};

// Helper function to clear auth data from localStorage (client-side only)
const clearAuthData = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};

// Initial state
const initialState = {
  user: null,
  loading: false,
  error: null,
  _hasHydrated: false,
};

// Async actions
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }) => {
    const response = await api.post("/auth/login", { email, password });
    saveAuthData(response.data.user, response.data.token);
    return response.data;
  }
);

export const register = createAsyncThunk("auth/register", async (userData) => {
  const response = await api.post("/auth/register", userData);
  saveAuthData(response.data.user, response.data.token);
  return response.data;
});

export const logout = createAsyncThunk("auth/logout", async () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("prepcart_cart");
  }
  clearAuthData();
});

export const getCurrentUser = createAsyncThunk("auth/me", async () => {
  const response = await api.get("/auth/me");
  saveAuthData(response.data.user, localStorage.getItem("token"));
  return response.data.user;
});

export const fetchUserData = createAsyncThunk(
  "auth/fetchUserData",
  async (_, { rejectWithValue }) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token) throw new Error("No token");

      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();

      // Return the complete user object
      return {
        id: data.user._id || data.user.id,
        email: data.user.email,
        name: data.user.name,
        province: data.user.province,
        tier: data.user.tier,
        monthly_plan_count: data.user.monthly_plan_count || 0,
        weekly_plan_count: data.user.weekly_plan_count || 0,
        planGenerationCount: data.user.planGenerationCount || 0,
        swapsAllowed: data.user.swapsAllowed || 3,
        swapsUsed: data.user.swapsUsed || 0,
        preferences: data.user.preferences || {},
        lastLogin: data.user.lastLogin,
        createdAt: data.user.createdAt,
        updatedAt: data.user.updatedAt,
        subscription: data.user.subscription || {},
        ageVerified: data.user.ageVerified || false,
        emailVerified: data.user.emailVerified || false,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Add reducer to restore auth state from localStorage
    restoreAuthState: (state) => {
      if (typeof window !== "undefined") {
        try {
          const token = localStorage.getItem("token");
          const userStr = localStorage.getItem("user");

          if (token && userStr) {
            const parsedUser = JSON.parse(userStr);

            // Make sure we have all required fields
            state.user = {
              id: parsedUser.id || parsedUser._id,
              email: parsedUser.email,
              name: parsedUser.name,
              province: parsedUser.province,
              tier: parsedUser.tier,
              monthly_plan_count: parsedUser.monthly_plan_count || 0,
              weekly_plan_count: parsedUser.weekly_plan_count || 0,
              planGenerationCount: parsedUser.planGenerationCount || 0,
              swapsAllowed: parsedUser.swapsAllowed || 3,
              swapsUsed: parsedUser.swapsUsed || 0,
              preferences: parsedUser.preferences || {},
              lastLogin: parsedUser.lastLogin,
              createdAt: parsedUser.createdAt,
              updatedAt: parsedUser.updatedAt,
              subscription: parsedUser.subscription || {},
              ageVerified: parsedUser.ageVerified || false,
              emailVerified: parsedUser.emailVerified || false,
            };
          }
        } catch (error) {
          console.error("Error restoring auth state:", error);
          clearAuthData();
        }
      }
      state._hasHydrated = true;
    },
  },
  // For update User
  updateUserTier: (state, action) => {
    if (state.user) {
      state.user.tier = action.payload.tier;
      state.user.swapsAllowed = action.payload.swapsAllowed;
    }
  },

  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;

        // Store the complete user object from backend
        state.user = {
          id: action.payload.user._id || action.payload.user.id,
          email: action.payload.user.email,
          name: action.payload.user.name,
          province: action.payload.user.province,
          tier: action.payload.user.tier,
          // Add these fields:
          monthly_plan_count: action.payload.user.monthly_plan_count || 0,
          weekly_plan_count: action.payload.user.weekly_plan_count || 0,
          planGenerationCount: action.payload.user.planGenerationCount || 0,
          swapsAllowed: action.payload.user.swapsAllowed || 3,
          swapsUsed: action.payload.user.swapsUsed || 0,
          preferences: action.payload.user.preferences || {},
          lastLogin: action.payload.user.lastLogin,
          createdAt: action.payload.user.createdAt,
          updatedAt: action.payload.user.updatedAt,
          subscription: action.payload.user.subscription || {},
          ageVerified: action.payload.user.ageVerified || false,
          emailVerified: action.payload.user.emailVerified || false,
        };

        const token = action.payload.tokens?.accessToken;
        if (token && typeof window !== "undefined") {
          localStorage.setItem("token", token);
          // Store the complete user object
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;

        // Store the complete user object
        state.user = {
          id: action.payload.user._id || action.payload.user.id,
          email: action.payload.user.email,
          name: action.payload.user.name,
          province: action.payload.user.province,
          tier: action.payload.user.tier,
          monthly_plan_count: action.payload.user.monthly_plan_count || 0,
          weekly_plan_count: action.payload.user.weekly_plan_count || 0,
          planGenerationCount: action.payload.user.planGenerationCount || 0,
          swapsAllowed: action.payload.user.swapsAllowed || 3,
          swapsUsed: action.payload.user.swapsUsed || 0,
          preferences: action.payload.user.preferences || {},
          lastLogin: action.payload.user.lastLogin,
          createdAt: action.payload.user.createdAt,
          updatedAt: action.payload.user.updatedAt,
          subscription: action.payload.user.subscription || {},
          ageVerified: action.payload.user.ageVerified || false,
          emailVerified: action.payload.user.emailVerified || false,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.tokens.accessToken);
          localStorage.setItem(
            "refreshToken",
            action.payload.tokens.refreshToken
          );
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.error = null;
      });

    // Get Current User
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;

        // Store the complete user object
        state.user = {
          id: action.payload._id || action.payload.id,
          email: action.payload.email,
          name: action.payload.name,
          province: action.payload.province,
          tier: action.payload.tier,
          // Add these fields:
          monthly_plan_count: action.payload.monthly_plan_count || 0,
          weekly_plan_count: action.payload.weekly_plan_count || 0,
          planGenerationCount: action.payload.planGenerationCount || 0,
          swapsAllowed: action.payload.swapsAllowed || 3,
          swapsUsed: action.payload.swapsUsed || 0,
          preferences: action.payload.preferences || {},
          lastLogin: action.payload.lastLogin,
          createdAt: action.payload.createdAt,
          updatedAt: action.payload.updatedAt,
          subscription: action.payload.subscription || {},
          ageVerified: action.payload.ageVerified || false,
          emailVerified: action.payload.emailVerified || false,
        };

        // Also update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(state.user));
        }
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.user = null;
      });
    // Fetch user in payment and cancel part
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(action.payload));
        }
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const { clearError, restoreAuthState } = authSlice.actions;
export default authSlice.reducer;
