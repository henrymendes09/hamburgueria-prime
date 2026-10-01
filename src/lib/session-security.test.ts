import { expect, it } from "vitest";
import { credentialVersion, isValidSession } from "./session-security";
it("revokes sessions on password changes, blocking, secret changes or missing version", () => {
  const version = credentialVersion("private-hash", "test-secret");
  expect(isValidSession(version, "private-hash", "test-secret", false)).toBe(true);
  expect(isValidSession(version, "new-hash", "test-secret", false)).toBe(false);
  expect(isValidSession(version, "private-hash", "test-secret", true)).toBe(false);
  expect(isValidSession(version, "private-hash", "new-secret", false)).toBe(false);
  expect(isValidSession(undefined, "private-hash", "test-secret", false)).toBe(false);
});
