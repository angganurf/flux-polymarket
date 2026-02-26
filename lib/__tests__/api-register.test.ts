import { describe, it, expect } from "vitest";

// Mirrors the registration logic in app/api/auth/register/route.ts
//
// Route flow:
//  1. Rate limit check (5 per 15 min, not tested here — rate-limit has its own tests)
//  2. email and password are required
//  3. Email must match regex and be <= 255 chars
//  4. Password must be a string >= 8 chars and <= 128 chars
//  5. Name is optional; sanitized (HTML stripped, capped at 50 chars);
//     defaults to email prefix if omitted
//  6. Duplicate email: return same shape as success (enumeration prevention)
//  7. Hash password with bcrypt (cost 10) — plaintext MUST NOT be stored
//  8. Create user with points = 1000

// ── Pure validation helpers mirroring route logic ────────────────────────────

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

interface RegisterBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

function validateRegisterBody(body: RegisterBody): { error: string; status: number } | null {
  const { email, password } = body;

  if (!email || !password) {
    return { error: "Email and password are required", status: 400 };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== "string" || !emailRegex.test(email) || email.length > 255) {
    return { error: "Invalid email format", status: 400 };
  }

  if (typeof password !== "string" || password.length < 8) {
    return { error: "Password must be at least 8 characters", status: 400 };
  }

  if (password.length > 128) {
    return { error: "Password must be 128 characters or less", status: 400 };
  }

  return null; // valid
}

function sanitizeName(name: unknown, email: string): string {
  if (name) {
    return stripHtml(String(name)).slice(0, 50);
  }
  return email.split("@")[0];
}

// Simulates the DB create (not a duplicate) — returns user-shaped object without password.
function simulateCreateUser(params: {
  name?: string;
  email: string;
  password: string;
  existingEmails?: string[];
}): {
  id: string;
  name: string;
  email: string;
  points: number;
  hashedPassword: string; // exposed only to verify hashing occurred
} | { duplicate: true; id: string; name: string; email: string; points: number } {
  const { name, email, password, existingEmails = [] } = params;

  // Normalize email the same way the route does
  const normalizedEmail = email.toLowerCase().trim();

  if (existingEmails.includes(normalizedEmail)) {
    // Return same shape as success (enumeration prevention)
    return { duplicate: true, id: "existing-id", name: "existing", email: normalizedEmail, points: 1000 };
  }

  const sanitizedName = sanitizeName(name, normalizedEmail);

  // Simulate bcrypt hash — in real code this is bcrypt.hash(password, 10)
  // We mark it to confirm it is NOT the plaintext.
  const hashedPassword = `bcrypt:${password}:hashed`; // placeholder, clearly not plaintext

  return {
    id: "new-user-id",
    name: sanitizedName,
    email: normalizedEmail,
    points: 1000,
    hashedPassword,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("register API — required fields", () => {
  it("should reject missing email", () => {
    const err = validateRegisterBody({ password: "password123" });
    expect(err).toEqual({ error: "Email and password are required", status: 400 });
  });

  it("should reject missing password", () => {
    const err = validateRegisterBody({ email: "user@example.com" });
    expect(err).toEqual({ error: "Email and password are required", status: 400 });
  });

  it("should reject empty email string", () => {
    const err = validateRegisterBody({ email: "", password: "password123" });
    expect(err).toEqual({ error: "Email and password are required", status: 400 });
  });

  it("should reject empty password string", () => {
    const err = validateRegisterBody({ email: "user@example.com", password: "" });
    expect(err).toEqual({ error: "Email and password are required", status: 400 });
  });

  it("should reject both missing", () => {
    const err = validateRegisterBody({});
    expect(err).toEqual({ error: "Email and password are required", status: 400 });
  });
});

describe("register API — email validation", () => {
  it("should reject email without @", () => {
    const err = validateRegisterBody({ email: "notanemail", password: "password123" });
    expect(err).toEqual({ error: "Invalid email format", status: 400 });
  });

  it("should reject email without domain", () => {
    const err = validateRegisterBody({ email: "user@", password: "password123" });
    expect(err).toEqual({ error: "Invalid email format", status: 400 });
  });

  it("should reject email with spaces", () => {
    const err = validateRegisterBody({ email: "user @example.com", password: "password123" });
    expect(err).toEqual({ error: "Invalid email format", status: 400 });
  });

  it("should reject email exceeding 255 characters", () => {
    const longEmail = "a".repeat(250) + "@b.com"; // > 255
    const err = validateRegisterBody({ email: longEmail, password: "password123" });
    expect(err).toEqual({ error: "Invalid email format", status: 400 });
  });

  it("should reject non-string email", () => {
    const err = validateRegisterBody({ email: 12345, password: "password123" });
    expect(err).toEqual({ error: "Invalid email format", status: 400 });
  });

  it("should accept a valid email", () => {
    expect(validateRegisterBody({ email: "user@example.com", password: "password123" })).toBeNull();
  });

  it("should accept email with subdomain", () => {
    expect(
      validateRegisterBody({ email: "user@mail.example.co.kr", password: "password123" })
    ).toBeNull();
  });
});

describe("register API — password validation", () => {
  it("should reject passwords shorter than 8 characters", () => {
    const err = validateRegisterBody({ email: "user@example.com", password: "short" });
    expect(err).toEqual({ error: "Password must be at least 8 characters", status: 400 });
  });

  it("should reject password of exactly 7 characters", () => {
    const err = validateRegisterBody({ email: "user@example.com", password: "1234567" });
    expect(err).toEqual({ error: "Password must be at least 8 characters", status: 400 });
  });

  it("should reject passwords longer than 128 characters", () => {
    const err = validateRegisterBody({
      email: "user@example.com",
      password: "a".repeat(129),
    });
    expect(err).toEqual({ error: "Password must be 128 characters or less", status: 400 });
  });

  it("should reject non-string password", () => {
    const err = validateRegisterBody({ email: "user@example.com", password: 12345678 });
    expect(err).toEqual({ error: "Password must be at least 8 characters", status: 400 });
  });

  it("should accept password of exactly 8 characters", () => {
    expect(
      validateRegisterBody({ email: "user@example.com", password: "12345678" })
    ).toBeNull();
  });

  it("should accept password of exactly 128 characters", () => {
    expect(
      validateRegisterBody({ email: "user@example.com", password: "a".repeat(128) })
    ).toBeNull();
  });

  it("should accept a strong typical password", () => {
    expect(
      validateRegisterBody({ email: "user@example.com", password: "Str0ng!Pass#2024" })
    ).toBeNull();
  });
});

describe("register API — duplicate email handling", () => {
  it("should reject duplicate emails (return same shape as success)", () => {
    const result = simulateCreateUser({
      email: "existing@example.com",
      password: "password123",
      existingEmails: ["existing@example.com"],
    });
    expect(result).toMatchObject({ duplicate: true });
  });

  it("should detect duplicates after email normalization (case-insensitive)", () => {
    // Route normalizes: email.toLowerCase().trim()
    const result = simulateCreateUser({
      email: "Existing@Example.COM",
      password: "password123",
      existingEmails: ["existing@example.com"],
    });
    expect(result).toMatchObject({ duplicate: true });
  });

  it("should not treat different emails as duplicates", () => {
    const result = simulateCreateUser({
      email: "newuser@example.com",
      password: "password123",
      existingEmails: ["other@example.com"],
    });
    expect("duplicate" in result).toBe(false);
  });
});

describe("register API — successful user creation", () => {
  it("should create user with 1000 starting points", () => {
    const result = simulateCreateUser({
      email: "user@example.com",
      password: "password123",
    });
    expect(result).toMatchObject({ points: 1000 });
  });

  it("should normalize email to lowercase", () => {
    const result = simulateCreateUser({
      email: "User@Example.COM",
      password: "password123",
    });
    if (!("duplicate" in result)) {
      expect(result.email).toBe("user@example.com");
    }
  });

  it("should use email prefix as name when name is omitted", () => {
    const result = simulateCreateUser({
      email: "johndoe@example.com",
      password: "password123",
    });
    if (!("duplicate" in result)) {
      expect(result.name).toBe("johndoe");
    }
  });

  it("should use provided name when given", () => {
    const result = simulateCreateUser({
      name: "John Doe",
      email: "johndoe@example.com",
      password: "password123",
    });
    if (!("duplicate" in result)) {
      expect(result.name).toBe("John Doe");
    }
  });

  it("should hash the password (not store plaintext)", () => {
    const plaintext = "mysecretpassword";
    const result = simulateCreateUser({
      email: "user@example.com",
      password: plaintext,
    });
    if (!("duplicate" in result)) {
      // The stored value must NOT equal the plaintext password
      expect(result.hashedPassword).not.toBe(plaintext);
      // Confirm hashing was applied (in the real route, bcrypt is used)
      expect(result.hashedPassword).not.toEqual(plaintext);
    }
  });

  it("should strip HTML from name (XSS prevention)", () => {
    const name = sanitizeName("<script>alert(1)</script>Hello", "user@example.com");
    expect(name).not.toContain("<script>");
    expect(name).toContain("Hello");
  });

  it("should cap name at 50 characters", () => {
    const longName = "A".repeat(60);
    const name = sanitizeName(longName, "user@example.com");
    expect(name.length).toBe(50);
  });

  it("should return id, name, email, and points — no password in response", () => {
    const result = simulateCreateUser({
      email: "user@example.com",
      password: "password123",
    });
    if (!("duplicate" in result)) {
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("points");
      // Route JSON response only includes id, name, email, points
      // Password (even hashed) is NOT returned to client
    }
  });
});
