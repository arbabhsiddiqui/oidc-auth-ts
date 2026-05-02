import { defineConfig } from "drizzle-kit";
import { env } from "./src/common/config/env";

export default defineConfig({
    schema: "./src/**/*.schema.ts",
    out: "./src/common/db/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: env.DATABASE_URI!,
    },
});