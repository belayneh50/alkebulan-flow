export type Status = "Planning" | "In progress" | "Review" | "Completed" | "On hold";
export type Priority = "Low" | "Medium" | "High";
export type Role = "Owner" | "Admin" | "Team";
export interface Client { id:string; name:string; company:string; industry:string; activeProjects:number; value:number; tone:string }
export interface Project { id:string; name:string; clientId:string; status:Status; progress:number; due:string; budget:number; color:string }
export interface Task { id:string; title:string; projectId:string; status:"Backlog"|"In progress"|"Review"|"Done"; priority:Priority; assignee:string; due:string }
export interface Activity { id:string; actor:string; action:string; target:string; time:string; kind:"task"|"file"|"project"|"message" }
