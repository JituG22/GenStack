import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { User, LoginRequest, RegisterRequest } from "../types";
import { authApi } from "../lib/api";
import { logoutService } from "../services/logoutService";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "LOAD_USER"; payload: { user: User; token: string } }
  | { type: "INITIAL_LOAD_COMPLETE" };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to prevent immediate redirect
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...initialState,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "LOAD_USER":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case "INITIAL_LOAD_COMPLETE":
      return {
        ...state,
        isLoading: false,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          console.log("Loading user from localStorage:", {
            user: user.email,
            token: token.substring(0, 10) + "...",
          });

          // Load user immediately from localStorage
          dispatch({
            type: "LOAD_USER",
            payload: { user, token },
          });

          // Validate token with backend in background
          try {
            console.log("Background validation of token...");
            const currentUser = await authApi.getProfile();
            console.log(
              "Token validation successful, updating user data:",
              currentUser
            );

            // Update with fresh user data if different
            dispatch({
              type: "LOAD_USER",
              payload: { user: currentUser, token },
            });

            // Update localStorage with fresh user data
            localStorage.setItem("user", JSON.stringify(currentUser));
          } catch (error) {
            console.log("Token validation failed in background:", error);
            // Don't immediately log out, let the user continue until they make a request
            // The API layer will handle invalid tokens on actual requests
          }
        } catch (error) {
          console.log("Error parsing user data:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          dispatch({ type: "INITIAL_LOAD_COMPLETE" });
        }
      } else {
        console.log("No token found in localStorage");
        // No token found, complete initial loading
        dispatch({ type: "INITIAL_LOAD_COMPLETE" });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      dispatch({ type: "AUTH_START" });

      const response = await authApi.login(credentials);
      const { user, token } = response;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user, token },
      });
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error.message || "Login failed",
      });
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      dispatch({ type: "AUTH_START" });

      const response = await authApi.register(userData);
      const { user, token } = response;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user, token },
      });
    } catch (error: any) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error.message || "Registration failed",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Perform comprehensive cleanup
      await logoutService.performLogout();
    } catch (error) {
      console.error("Error during logout cleanup:", error);
      // Continue with logout even if cleanup fails
    } finally {
      // Always dispatch logout action to update auth state
      dispatch({ type: "LOGOUT" });
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
