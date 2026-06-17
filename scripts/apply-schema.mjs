import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const sql = neon(databaseUrl);
const schema = fs.readFileSync("neon/schema.sql", "utf8");

const statements = [];
let current = "";
let dollarQuote = false;

for (const line of schema.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("--")) {
    continue;
  }

  if (trimmed.includes("$$")) {
    dollarQuote = !dollarQuote;
  }

  current += `${line}\n`;
  if (!dollarQuote && trimmed.endsWith(";")) {
    statements.push(current);
    current = "";
  }
}

if (current.trim()) {
  statements.push(current);
}

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Applied ${statements.length} schema statements.`);
