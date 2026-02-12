export type Role = "admin" | "user";

const USERS = {
  "admin@company.com": {
    password: "admin123",
    role: "admin" as Role,
  },
  "user@company.com": {
    password: "user123",
    role: "user" as Role,
  },
};

export function login(email: string, password: string) {
  const user = USERS[email as keyof typeof USERS];
  if (!user || user.password !== password) {
    throw new Error("Invalid credentials");
  }
  return { email, role: user.role };
}
