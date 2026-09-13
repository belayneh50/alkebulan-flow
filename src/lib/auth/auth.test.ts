import { describe,expect,it } from "vitest";
import { createDatabase,seedDatabase } from "@/lib/db";
import { createSession,findSession,revokeSession } from "./session";
import { hashPassword,verifyPassword } from "./password";
import { can } from "./permissions";

describe("local authentication",()=>{
 it("hashes passwords with a unique salt and verifies safely",()=>{const a=hashPassword("StrongPass123"),b=hashPassword("StrongPass123");expect(a).not.toBe(b);expect(verifyPassword("StrongPass123",a)).toBe(true);expect(verifyPassword("wrong",a)).toBe(false)});
 it("creates and revokes opaque sessions",()=>{const db=createDatabase(":memory:");seedDatabase(db);const created=createSession(db,"u1","w1");expect(findSession(db,created.token)?.role).toBe("owner");revokeSession(db,created.token);expect(findSession(db,created.token)).toBeNull();db.close()});
 it("enforces the role matrix",()=>{expect(can("team","manage-tasks")).toBe(true);expect(can("team","manage-projects")).toBe(false);expect(can("admin","delete-projects")).toBe(false);expect(can("owner","manage-members")).toBe(true)});
});
