import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import sendResponse from "./response.js";
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Generate JWT token

const generateToken = (id: string, email: string, role: string): string => {
  return jwt.sign(
    {
      id,
      email,
      role,
    },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
};

//  Hash password
const getHashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Signup Validation
const validateSignup = (data: any): { valid: boolean; message?: string } => {
  const { firstName, lastName, email, password } = data;
  if (!firstName || !lastName || !email || !password) {
    return { valid: false, message: "All fields are required" };
  }
  return { valid: true };
};

// SignIn Validation
const validateSignIn = (data: any): { valid: boolean; message?: string } => {
  const { email, password } = data;
  if (!email || !password) {
    return { valid: false, message: "Email and password are required" };
  }
  return { valid: true };
};

export { generateToken, getHashPassword, validateSignup, validateSignIn };
