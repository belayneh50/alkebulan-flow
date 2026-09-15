import { describe, expect, it } from "vitest";
import { createDatabase, seedDatabase, wrapSqlite } from "@/lib/db";
import { createSession, findSession, revokeSession } from "./session";
import { hashPassword, verifyPassword } from "./password";
import { can } from "./permissions";

describe("local authentication", () => {
  it("hashes passwords with a unique salt and verifies safely", () => {
    const a = hashPassword("StrongPass123"), b = hashPassword("StrongPass123");
    expect(a).not.toBe(b);
    expect(verifyPassword("StrongPass123", a)).toBe(true);
    expect(verifyPassword("wrong", a)).toBe(false);
  });

  it("creates and revokes opaque sessions", async () => {
    const sqlite = createDatabase(":memory:");
    seedDatabase(sqlite);
    const db = wrapSqlite(sqlite);
    const created = await createSession(db, "u1", "w1");
    expect((await findSession(db, created.token))?.role).toBe("owner");
    await revokeSession(db, created.token);
    expect(await findSession(db, created.token)).toBeNull();
    sqlite.close();
  });

  it("enforces the role matrix", () => {
    expect(can("team", "manage-tasks")).toBe(true);
    expect(can("team", "manage-projects")).toBe(false);
    expect(can("admin", "delete-projects")).toBe(false);
    expect(can("owner", "manage-members")).toBe(true);
  });
});
