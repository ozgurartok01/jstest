import { config } from "dotenv";

config({ path: "../../.env" });
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const client = createClient({
  url: `file:${process.env.DATABASE_URL}`
});

// Connect Drizzle ORM to LibSQL
export const db = drizzle(client);
