import { extname } from "node:path";
export const MAX_UPLOAD_SIZE=5*1024*1024;
export const ALLOWED_UPLOADS=new Map([["application/pdf",".pdf"],["image/png",".png"],["image/jpeg",".jpg"],["text/csv",".csv"],["application/vnd.openxmlformats-officedocument.wordprocessingml.document",".docx"]]);
export function validateUploadMetadata(file:{name:string;type:string;size:number}){if(file.size<=0||file.size>MAX_UPLOAD_SIZE)return "File must be between 1 byte and 5 MB";const expected=ALLOWED_UPLOADS.get(file.type);if(!expected||extname(file.name).toLowerCase()!==expected)return "Unsupported or mismatched file type";return null}
