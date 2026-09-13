export type Action="read"|"manage-tasks"|"manage-projects"|"delete-projects"|"manage-members";
export type WorkspaceRole="owner"|"admin"|"team";
const allowed:Record<WorkspaceRole,Set<Action>>={owner:new Set(["read","manage-tasks","manage-projects","delete-projects","manage-members"]),admin:new Set(["read","manage-tasks","manage-projects"]),team:new Set(["read","manage-tasks"])};
export function can(role:WorkspaceRole,action:Action){return allowed[role].has(action)}
