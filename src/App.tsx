import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return <Login />;
  }

  const user = JSON.parse(rawUser);

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
}
