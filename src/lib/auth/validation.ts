import { z } from 'zod';

export const emailPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(12),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(12),
  password: z.string().min(8),
});

export const emailOnlySchema = z.object({
  email: z.string().email(),
});
