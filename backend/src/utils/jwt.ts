import jwt from "jsonwebtoken";
import config from "../config/environment";

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
}

export const generateToken = (payload: JwtPayload): string => {
  try {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
  } catch (error) {
    throw new Error("Failed to generate token");
  }
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    return null;
  }
};
