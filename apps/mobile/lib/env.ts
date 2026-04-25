import { z } from "zod";

const schema = z.object({
  EXPO_PUBLIC_API_URL: z
    .string()
    .url("EXPO_PUBLIC_API_URL must be a valid URL")
    .default("http://localhost:3000"),
});

const result = schema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});

if (!result.success) {
  console.error("Invalid environment variables:");
  for (const issue of result.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  throw new Error("Invalid environment variables. See errors above.");
}

export const env = result.data;
