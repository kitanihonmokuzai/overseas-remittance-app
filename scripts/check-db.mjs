import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const tables = await sql`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
  order by table_name
`;

console.log(tables.map((table) => table.table_name).join("\n"));
