import { z } from "zod";

export const identifySchema = z
  .object({
    email: z.email().nullable().optional(),
    phoneNumber: z
      .string()
      .regex(/^[0-9]{6,15}$/)
      .nullable()
      .optional(),
  })
  .refine(
    (data) => data.email || data.phoneNumber,
    {
      message: "Either email or phoneNumber must be provided",
    }
  );