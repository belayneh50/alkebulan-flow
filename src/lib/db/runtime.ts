import { AsyncLocalStorage } from "node:async_hooks";
import type Database from "better-sqlite3";
import { Pool, type PoolClient } from "@neondatabase/serverless";
import { postgresSchemaSql } from "./schema-postgres";
import { hashPassword } from "@/lib/auth/password";

export type RunResult = { changes: number };
export type RuntimeStatement = {
  all<T = Record<string, unknown>>(...params: unknown[]): Promise<T[]>;
  get<T = Record<string, unknown>>(...params: unknown[]): Promise<T | undefined>;
  run(...params: unknown[]): Promise<RunResult>;
};
export type RuntimeDatabase = {
  prepare(sql: string): RuntimeStatement;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
};

const aliases: Record<string, string> = {
  activeprojects: "activeProjects", clientid: "clientId", createdat: "createdAt",
  mimetype: "mimeType", originalname: "originalName", passwordhash: "passwordHash",
  projectid: "projectId", readat: "readAt", storedname: "storedName",
  userid: "userId", workspaceid: "workspaceId", workspacename: "workspaceName",
};

function normalizeRow<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => {
    const mapped = aliases[key] ?? key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const normalized = value instanceof Date ? value.toISOString() : mapped === "activeProjects" && typeof value === "string" ? Number(value) : value;
    return [mapped, normalized];
  })) as T;
}

function postgresSql(sql: string) {
  let index = 0;
  return sql
    .replace(/datetime\('now','\+15 minutes'\)/gi, "(CURRENT_TIMESTAMP + INTERVAL '15 minutes')")
    .replace(/datetime\('now'\)/gi, "CURRENT_TIMESTAMP")
    .replace(/\?/g, () => `$${++index}`);
}

export function wrapSqlite(db: Database.Database): RuntimeDatabase {
  return {
    prepare(sql) {
      const statement = db.prepare(sql);
      return {
        async all<T>(...params: unknown[]) { return (statement.all(...params) as Record<string, unknown>[]).map(row => normalizeRow<T>(row)); },
        async get<T>(...params: unknown[]) { const row=statement.get(...params) as Record<string, unknown>|undefined;return row?normalizeRow<T>(row):undefined; },
        async run(...params: unknown[]) { const result = statement.run(...params); return { changes: result.changes }; },
      };
    },
    async transaction<T>(callback: () => Promise<T>) {
      db.exec("BEGIN");
      try { const result = await callback(); db.exec("COMMIT"); return result; }
      catch (error) { db.exec("ROLLBACK"); throw error; }
    },
  };
}

function postgresDatabase(pool: Pool): RuntimeDatabase {
  const transactionClient = new AsyncLocalStorage<PoolClient>();
  const query = async (sql: string, params: unknown[]) => {
    const client = transactionClient.getStore();
    return client ? client.query(postgresSql(sql), params) : pool.query(postgresSql(sql), params);
  };
  return {
    prepare(sql) {
      return {
        async all<T>(...params: unknown[]) { const result = await query(sql, params); return result.rows.map(row => normalizeRow<T>(row)); },
        async get<T>(...params: unknown[]) { const result = await query(sql, params); return result.rows[0] ? normalizeRow<T>(result.rows[0]) : undefined; },
        async run(...params: unknown[]) { const result = await query(sql, params); return { changes: result.rowCount ?? 0 }; },
      };
    },
    async transaction<T>(callback: () => Promise<T>) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await transactionClient.run(client, callback);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally { client.release(); }
    },
  };
}

async function seedPostgres(db: RuntimeDatabase) {
  if (process.env.SEED_DEMO !== "1") return;
  const row = await db.prepare("SELECT COUNT(*) count FROM users").get<{ count: string | number }>();
  if (Number(row?.count ?? 0)) return;
  const now = Date.now();
  const ago = (milliseconds: number) => new Date(now - milliseconds).toISOString();
  await db.transaction(async () => {
    await db.prepare("INSERT INTO users(id,name,email,password_hash) VALUES(?,?,?,?)").run("u1", "Maya Okafor", "demo@alkebulan.local", hashPassword("FlowDemo2026!"));
    await db.prepare("INSERT INTO workspaces(id,name,slug) VALUES(?,?,?)").run("w1", "North & South Studio", "north-south-studio");
    await db.prepare("INSERT INTO memberships(user_id,workspace_id,role) VALUES(?,?,?)").run("u1", "w1", "owner");
    for (const client of [["c1","Amara Studio","Amara Studio","Brand design",18400,"Warm and concise"],["c2","Northstar Build","Northstar Build Co.","Construction",12600,"Direct and detailed"],["c3","Solace Health","Solace Health","Healthcare",9800,"Clear and reassuring"],["c4","Maji Coffee","Maji Coffee Roasters","Hospitality",7200,"Friendly and energetic"]])
      await db.prepare("INSERT INTO clients(id,workspace_id,name,company,industry,value,tone) VALUES(?,?,?,?,?,?,?)").run(client[0], "w1", ...client.slice(1));
    for (const project of [["p1","c1","Brand system refresh","In progress",68,"2026-09-24",9400,"#166534"],["p2","c1","Website launch","Review",86,"2026-09-18",9000,"#0f766e"],["p3","c2","Site operations portal","In progress",42,"2026-10-08",12600,"#2563eb"],["p4","c3","Patient onboarding","Planning",18,"2026-10-21",9800,"#7c3aed"]])
      await db.prepare("INSERT INTO projects(id,workspace_id,client_id,name,status,progress,due,budget,color) VALUES(?,?,?,?,?,?,?,?,?)").run(project[0], "w1", ...project.slice(1));
    for (const task of [["t1","p2","Approve responsive homepage","Review","High","Maya","2026-09-14"],["t2","p1","Package icon library","In progress","Medium","Theo","2026-09-17"],["t3","p3","Map contractor permissions","Backlog","High","Noah","2026-09-20"],["t4","p4","Draft onboarding survey","In progress","Medium","Maya","2026-09-22"],["t5","p2","Upload final brand assets","Done","Low","Theo","2026-09-12"],["t6","p1","Review accessibility notes","Review","High","Maya","2026-09-13"],["t7","p4","Set stakeholder workshop","Backlog","Low","Noah","2026-09-26"],["t8","p3","QA invoice export","Done","Medium","Maya","2026-09-10"]])
      await db.prepare("INSERT INTO tasks(id,workspace_id,project_id,title,status,priority,assignee,due) VALUES(?,?,?,?,?,?,?,?)").run(task[0], "w1", ...task.slice(1));
    const activities = [["a1","Maya","moved a task to Review","Approve responsive homepage","task",ago(12*60_000)],["a2","Theo","uploaded","brand-guidelines-v3.pdf","file",ago(44*60_000)],["a3","Noah","updated the deadline","Site operations portal","project",ago(2*3_600_000)],["a4","Flow AI","drafted a client update for","Website launch","message",ago(3*3_600_000)]];
    for (const activity of activities) await db.prepare("INSERT INTO activities(id,workspace_id,actor,action,target,kind,created_at) VALUES(?,?,?,?,?,?,?)").run(activity[0], "w1", ...activity.slice(1));
    await db.prepare("INSERT INTO notifications(id,user_id,workspace_id,message) VALUES(?,?,?,?)").run(crypto.randomUUID(), "u1", "w1", "Two deadlines need attention this week.");
  });
}

export async function createPostgresRuntime(connectionString: string) {
  const pool = new Pool({ connectionString });
  for (const statement of postgresSchemaSql.split(";").map(value => value.trim()).filter(Boolean)) await pool.query(statement);
  const db = postgresDatabase(pool);
  await seedPostgres(db);
  return db;
}
