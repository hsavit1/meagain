import { z } from "zod";

const schema = z.object({
  DATABASE_FILE: z.string().min(1).default("dev.db"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:");
  for (const issue of result.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  throw new Error("Invalid environment variables. See errors above.");
}

export const env = result.data;
