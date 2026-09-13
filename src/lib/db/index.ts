import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { schemaSql } from "./schema";
import { hashPassword } from "@/lib/auth/password";

export type AppDatabase=Database.Database;
const defaultPath=join(process.cwd(),"data","alkebulan-flow.sqlite");

export function createDatabase(path=process.env.ALKEBULAN_DB_PATH||defaultPath){
 if(path!==":memory:")mkdirSync(dirname(path),{recursive:true});
 const db=new Database(path); db.pragma("journal_mode = WAL"); db.exec(schemaSql); return db;
}
let singleton:AppDatabase|undefined;
export function getDatabase(){singleton??=createDatabase();seedDatabase(singleton);return singleton}

export function seedDatabase(db:AppDatabase){
 if((db.prepare("SELECT COUNT(*) count FROM users").get() as {count:number}).count)return;
 const seed=db.transaction(()=>{
  db.prepare("INSERT INTO users(id,name,email,password_hash) VALUES(?,?,?,?)").run("u1","Maya Okafor","demo@alkebulan.local",hashPassword("FlowDemo2026!"));
  db.prepare("INSERT INTO workspaces(id,name,slug) VALUES(?,?,?)").run("w1","North & South Studio","north-south-studio");
  db.prepare("INSERT INTO memberships(user_id,workspace_id,role) VALUES(?,?,?)").run("u1","w1","owner");
  const clientStmt=db.prepare("INSERT INTO clients(id,workspace_id,name,company,industry,value,tone) VALUES(?,?,?,?,?,?,?)");
  [["c1","Amara Studio","Amara Studio","Brand design",18400,"Warm and concise"],["c2","Northstar Build","Northstar Build Co.","Construction",12600,"Direct and detailed"],["c3","Solace Health","Solace Health","Healthcare",9800,"Clear and reassuring"],["c4","Maji Coffee","Maji Coffee Roasters","Hospitality",7200,"Friendly and energetic"]].forEach(c=>clientStmt.run(c[0],"w1",...c.slice(1)));
  const projectStmt=db.prepare("INSERT INTO projects(id,workspace_id,client_id,name,status,progress,due,budget,color) VALUES(?,?,?,?,?,?,?,?,?)");
  [["p1","c1","Brand system refresh","In progress",68,"2026-09-24",9400,"#166534"],["p2","c1","Website launch","Review",86,"2026-09-18",9000,"#0f766e"],["p3","c2","Site operations portal","In progress",42,"2026-10-08",12600,"#2563eb"],["p4","c3","Patient onboarding","Planning",18,"2026-10-21",9800,"#7c3aed"]].forEach(p=>projectStmt.run(p[0],"w1",...p.slice(1)));
  const taskStmt=db.prepare("INSERT INTO tasks(id,workspace_id,project_id,title,status,priority,assignee,due) VALUES(?,?,?,?,?,?,?,?)");
  [["t1","p2","Approve responsive homepage","Review","High","Maya","Sep 14"],["t2","p1","Package icon library","In progress","Medium","Theo","Sep 17"],["t3","p3","Map contractor permissions","Backlog","High","Noah","Sep 20"],["t4","p4","Draft onboarding survey","In progress","Medium","Maya","Sep 22"],["t5","p2","Upload final brand assets","Done","Low","Theo","Sep 12"],["t6","p1","Review accessibility notes","Review","High","Maya","Sep 13"],["t7","p4","Set stakeholder workshop","Backlog","Low","Noah","Sep 26"],["t8","p3","QA invoice export","Done","Medium","Maya","Sep 10"]].forEach(t=>taskStmt.run(t[0],"w1",...t.slice(1)));
  const activityStmt=db.prepare("INSERT INTO activities(id,workspace_id,actor,action,target,kind,created_at) VALUES(?,?,?,?,?,?,datetime('now',?))");
  [["Maya","moved a task to Review","Approve responsive homepage","task","-12 minutes"],["Theo","uploaded","brand-guidelines-v3.pdf","file","-44 minutes"],["Noah","updated the deadline","Site operations portal","project","-2 hours"],["Flow AI","drafted a client update for","Website launch","message","-3 hours"]].forEach((a,i)=>activityStmt.run(`a${i+1}`,"w1",...a));
  db.prepare("INSERT INTO notifications(id,user_id,workspace_id,message) VALUES(?,?,?,?)").run(randomUUID(),"u1","w1","Two deadlines need attention this week.");
 }); seed();
}
