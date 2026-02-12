import { useState } from "react";
import { login } from "../auth/auth";

export default function Login() {
    localStorage.removeItem("user");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = () => {
    try {
      const user = login(email.trim(), password.trim());

      console.log("LOGIN SUCCESS", user);

      localStorage.setItem(
  "user",
  JSON.stringify({ ...user, loginAt: Date.now() })
);


      // HARD redirect – no router involved
      window.location.href = import.meta.env.BASE_URL;

    } catch (err: any) {
      alert(err.message || "Invalid credentials");
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ border: "1px solid black", padding: 20, width: 300 }}>
        <h2>Login</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <button onClick={onLogin} style={{ width: "100%" }}>
          Login
        </button>
      </div>
    </div>
  );
}
