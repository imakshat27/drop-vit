import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as pgliteDrizzle } from 'drizzle-orm/pglite';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
function createDatabase(){
 if(process.env.DATABASE_URL){ const client=new Pool({connectionString:process.env.DATABASE_URL}); return {db:pgDrizzle(client,{schema,casing:'snake_case'}),executeScript:(script:string)=>client.query(script),close:()=>client.end()}; }
 if(process.env.NODE_ENV==='production' && !process.env.ALLOW_LOCAL_DB) throw new Error('Production requires DATABASE_URL. Set ALLOW_LOCAL_DB=1 only for local production testing.');
 const path=process.env.LOCAL_DB_PATH || '.data/drop'; if(path!=='memory://')mkdirSync(dirname(path),{recursive:true}); const client=new PGlite(path); return {db:pgliteDrizzle(client,{schema,casing:'snake_case'}),executeScript:(script:string)=>client.exec(script),close:()=>client.close()};
}
const globalDb=globalThis as unknown as {dropDatabase?:ReturnType<typeof createDatabase>};
export function database(){return globalDb.dropDatabase ??= createDatabase();}
export function db(){return database().db;}
