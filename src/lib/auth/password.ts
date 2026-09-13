import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password:string){
 const salt=randomBytes(16).toString("hex");
 const digest=scryptSync(password,salt,64).toString("hex");
 return `scrypt:${salt}:${digest}`;
}
export function verifyPassword(password:string,stored:string){
 const [algorithm,salt,digest]=stored.split(":");
 if(algorithm!=="scrypt"||!salt||!digest)return false;
 const expected=Buffer.from(digest,"hex");
 const actual=scryptSync(password,salt,expected.length);
 return expected.length===actual.length&&timingSafeEqual(expected,actual);
}
