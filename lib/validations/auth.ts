import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Format email tidak valid").max(254);
export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password maksimal 72 karakter")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Password harus mengandung huruf dan angka");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password wajib diisi").max(72),
});

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    agree: z.literal("on", { errorMap: () => ({ message: "Anda harus menyetujui syarat penggunaan" }) }),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Konfirmasi password tidak sama" });

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Konfirmasi password tidak sama" });

export const profileSchema = z.object({ displayName: z.string().trim().min(2, "Nama minimal 2 karakter").max(80) });
