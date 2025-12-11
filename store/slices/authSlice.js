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

// Initial state - always null on server
const initialState = {
  user: null,
  loading: false,
  error: null,
  _hasHydrated: false, // Add hydration flag
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
  clearAuthData();
});

export const getCurrentUser = createAsyncThunk("auth/me", async () => {
  const response = await api.get("/auth/me");
  saveAuthData(response.data.user, localStorage.getItem("token"));
  return response.data.user;
});

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
            state.user = JSON.parse(userStr);
          }
        } catch (error) {
          console.error("Error restoring auth state:", error);
          clearAuthData();
        }
      }
      state._hasHydrated = true; // Mark as hydrated
    },
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
        state.user = action.payload.user;

        const token = action.payload.tokens?.accessToken;
        if (token && typeof window !== "undefined") {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(action.payload.user));
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
        state.user = action.payload.user;

        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.tokens.accessToken);
          localStorage.setItem(
            "refreshToken",
            action.payload.tokens.refreshToken
          );
          localStorage.setItem("user", JSON.stringify(action.payload.user));
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
        state.user = action.payload;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.user = null;
      });
  },
});

export const { clearError, restoreAuthState } = authSlice.actions;
export default authSlice.reducer;
