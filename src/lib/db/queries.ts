import { getDatabase } from "@/lib/db";
import type { Activity, Client, Project, Task } from "@/lib/types";

function formatActivityTime(value:string|Date){
 const date=value instanceof Date?value:new Date(value.includes("T")?value:value.replace(" ","T")+"Z");
 return date.toLocaleString("en",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
}

export async function getWorkspaceData(workspaceId:string){const db=await getDatabase();
 const [clients,projects,tasks,rows,notifications,files]=await Promise.all([
 db.prepare(`SELECT c.id,c.name,c.company,c.industry,c.value,c.tone,COUNT(p.id) activeProjects FROM clients c LEFT JOIN projects p ON p.client_id=c.id AND p.status!='Completed' WHERE c.workspace_id=? GROUP BY c.id,c.name,c.company,c.industry,c.value,c.tone,c.created_at ORDER BY c.created_at`).all<{id:string;name:string;company:string;industry:string;activeProjects:number;value:number;tone:string}>(workspaceId),
 db.prepare("SELECT id,name,client_id clientId,status,progress,due,budget,color FROM projects WHERE workspace_id=? ORDER BY created_at").all<Project>(workspaceId),
 db.prepare("SELECT id,title,project_id projectId,status,priority,assignee,due FROM tasks WHERE workspace_id=? ORDER BY created_at").all<Task>(workspaceId),
 db.prepare("SELECT id,actor,action,target,kind,created_at createdAt FROM activities WHERE workspace_id=? ORDER BY created_at DESC LIMIT 20").all<Omit<Activity,"time">&{createdAt:string|Date}>(workspaceId),
 db.prepare("SELECT id,message,read_at readAt,created_at createdAt FROM notifications WHERE workspace_id=? ORDER BY created_at DESC").all<{id:string;message:string;readAt:string|null;createdAt:string}>(workspaceId),
 db.prepare("SELECT id,project_id projectId,original_name originalName,mime_type mimeType,size,created_at createdAt FROM uploaded_files WHERE workspace_id=? ORDER BY created_at DESC").all<{id:string;projectId:string|null;originalName:string;mimeType:string;size:number;createdAt:string}>(workspaceId),
 ]);
 const activities=rows.map(r=>({...r,time:formatActivityTime(r.createdAt)}));
 return {clients:clients as Client[],projects,tasks,activities,notifications,files};
}
