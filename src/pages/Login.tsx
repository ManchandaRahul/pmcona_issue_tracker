import { useState } from "react";
import { login } from "../auth/auth";

export default function Login() {
  // Always clear previous session
  localStorage.removeItem("user");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = () => {
    try {
      const user = login(email.trim(), password.trim());

      localStorage.setItem(
        "user",
        JSON.stringify({ ...user, loginAt: Date.now() })
      );

      // Hard redirect (no router)
      window.location.href = import.meta.env.BASE_URL;
    } catch (err: any) {
      alert(err.message || "Invalid credentials");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 360,
          backgroundColor: "#ffffff",
          border: "1px solid #d1d5db",
          padding: 24,
          boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginBottom: 8 }}>Support / Issue Tracker</h2>
        <p style={{ marginBottom: 20, color: "#555", fontSize: 14 }}>
          Secure Login
        </p>

        {/* Email */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            Email
          </label>
          <input
            type="email"
            placeholder="user@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              border: "1px solid #9ca3af",
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              border: "1px solid #9ca3af",
            }}
          />
        </div>

        {/* Login Button */}
        <button
          onClick={onLogin}
          style={{
            width: "100%",
            padding: "10px 0",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
}
