import { Pool } from "pg";

export const db = new Pool({
  user: "postgres",
  host: "localhost",
  password: "postgres",
  database: "personal-web",
  port: 5433,
  max: 5,
});
