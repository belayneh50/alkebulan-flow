import { redirect } from "next/navigation";
import { DashboardApp } from "@/components/dashboard-app";
import { currentSession } from "@/lib/auth/session";
import { getWorkspaceData } from "@/lib/db/queries";
export default async function AppPage(){const session=await currentSession();if(!session)redirect("/login");const data=getWorkspaceData(session.workspaceId);return <DashboardApp initialData={data} user={{name:session.name,role:session.role,workspaceName:session.workspaceName}}/>}
