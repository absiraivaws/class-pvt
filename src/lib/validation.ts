import { z } from "zod";

export function isValidNIC(nic: string): boolean {
  const value = nic.trim().toUpperCase();
  // New NIC format: 12 digits
  if (/^\d{12}$/.test(value)) return true;
  // Old NIC format: 9 digits followed by V or X (case-insensitive)
  if (/^\d{9}[VX]$/.test(value)) return true;
  return false;
}

export function isValidPhone(phone: string): boolean {
  const value = phone.trim();
  // Sri Lankan format: 0XXXXXXXXX (10 digits) or +94XXXXXXXXX
  if (/^0\d{9}$/.test(value)) return true;
  if (/^\+94\d{9}$/.test(value)) return true;
  return false;
}

export function isValidSID(sid: string): boolean {
  const value = sid.trim().toUpperCase();
  // Accept formats like STU000123 or STU-2026-00125
  return /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(value) && value.length >= 4;
}

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const registerSchema = z
  .object({
    sid: z.string().refine(isValidSID, "Invalid SID format"),
    name: z.string().min(2, "Name is required"),
    nic: z.string().refine(isValidNIC, "Invalid NIC format"),
    streamId: z.string().min(1, "Stream is required"),
    guardianName: z.string().min(2, "Guardian name is required"),
    phone: z.string().refine(isValidPhone, "Invalid phone number"),
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v === true, "You must accept the terms"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  identifier: z.string().min(1, "SID or Email is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
