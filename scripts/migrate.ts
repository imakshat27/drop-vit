import { readFile } from 'node:fs/promises';
import { sql } from 'drizzle-orm';
import { db, database } from '../src/lib/db';
async function main(){
 await db().execute(sql`CREATE TABLE IF NOT EXISTS migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
 const found=await db().execute(sql`SELECT name FROM migrations WHERE name='0001_core'`);
 if(!found.rows.length){ await database().executeScript('BEGIN;'+await readFile('migrations/0001_core.sql','utf8')+"INSERT INTO migrations(name) VALUES('0001_core'); COMMIT;");console.log('Applied 0001_core');} else console.log('Schema up to date');
 await database().close();
}
main().catch(e=>{console.error(e);process.exit(1)});
