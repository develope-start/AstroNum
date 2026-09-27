import { z } from "zod";
import { isWideDate } from "@/lib/astro/wideDate";

export const personSchema = z.object({
  name: z.string().trim().min(1).max(120),
  date: z.string().refine(isWideDate, "Invalid date"),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Invalid time"),
  place: z.string().trim().min(1).max(200),
  lat: z.number().finite().min(-90).max(90),
  lon: z.number().finite().min(-180).max(180),
  timezone: z.string().trim().min(1).max(64),
});

export const labelSchema = z.string().trim().max(200).optional();

export function isValidPersonInput(value: unknown): value is z.infer<typeof personSchema> {
  return personSchema.safeParse(value).success;
}
