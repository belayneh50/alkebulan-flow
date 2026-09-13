import { getDatabase } from "@/lib/db";
import type { Activity, Client, Project, Task } from "@/lib/types";

export function getWorkspaceData(workspaceId:string){const db=getDatabase();
 const clients=db.prepare(`SELECT c.*,COUNT(p.id) activeProjects FROM clients c LEFT JOIN projects p ON p.client_id=c.id AND p.status!='Completed' WHERE c.workspace_id=? GROUP BY c.id ORDER BY c.created_at`).all(workspaceId) as Array<{id:string;name:string;company:string;industry:string;activeProjects:number;value:number;tone:string}>;
 const projects=db.prepare("SELECT id,name,client_id clientId,status,progress,due,budget,color FROM projects WHERE workspace_id=? ORDER BY created_at").all(workspaceId) as Project[];
 const tasks=db.prepare("SELECT id,title,project_id projectId,status,priority,assignee,due FROM tasks WHERE workspace_id=? ORDER BY created_at").all(workspaceId) as Task[];
 const rows=db.prepare("SELECT id,actor,action,target,kind,created_at createdAt FROM activities WHERE workspace_id=? ORDER BY created_at DESC LIMIT 20").all(workspaceId) as Array<Omit<Activity,"time">&{createdAt:string}>;
 const activities=rows.map(r=>({...r,time:new Date(r.createdAt.replace(" ","T")+"Z").toLocaleString("en",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}));
 const notifications=db.prepare("SELECT id,message,read_at readAt,created_at createdAt FROM notifications WHERE workspace_id=? ORDER BY created_at DESC").all(workspaceId) as Array<{id:string;message:string;readAt:string|null;createdAt:string}>;
 const files=db.prepare("SELECT id,project_id projectId,original_name originalName,mime_type mimeType,size,created_at createdAt FROM uploaded_files WHERE workspace_id=? ORDER BY created_at DESC").all(workspaceId) as Array<{id:string;projectId:string|null;originalName:string;mimeType:string;size:number;createdAt:string}>;
 return {clients:clients as Client[],projects,tasks,activities,notifications,files};
}
