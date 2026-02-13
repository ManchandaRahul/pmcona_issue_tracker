import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

/* ===== MASTER VALUES ===== */
const BUSINESS_UNITS = [
  "Andheri Office",
  "Haridwar",
  "Silvassa",
  "Vasai",
  "Palghar",
  "Andheri Unit",
  "Delhi",
];

const MODULES = [
  "Accounts & Finance",
  "Sales",
  "Purchase",
  "Inventory",
  "Manufacturing",
  "System Admin",
];

const SUPPORT_TYPES = [
  "Production Support",
  "UAT Support",
  "Bug Fix",
  "Enhancement",
  "Query",
];

// Status options (same as admin, user only views)
const STATUS_OPTIONS = ["New", "In Progress", "Reassigned", "Closed"];

export default function UserDashboard() {
  const user = JSON.parse(localStorage.getItem("user")!);

  const [tickets, setTickets] = useState<any[]>([]);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All"); // ✅ NEW

  const [businessUnit, setBusinessUnit] = useState("");
  const [module, setModule] = useState("");
  const [supportType, setSupportType] = useState("");
  const [description, setDescription] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = import.meta.env.BASE_URL;
  };

  useEffect(() => {
    const q = query(
      collection(db, "tickets"),
      where("createdBy", "==", user.email)
    );

    return onSnapshot(q, (snap) => {
      setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const submitTicket = async () => {
    if (!businessUnit || !module || !supportType || !description) {
      alert("Please fill all fields");
      return;
    }

    await addDoc(collection(db, "tickets"), {
      date: today,
      businessUnit,
      module,
      supportType,
      description,
      status: "New",
      createdBy: user.email,
      createdAt: new Date(),
    });

    setBusinessUnit("");
    setModule("");
    setSupportType("");
    setDescription("");
    setShowMyTickets(true);
  };

  // ✅ FILTERED TICKETS (USER SIDE)
  const filteredTickets =
    statusFilter === "All"
      ? tickets
      : tickets.filter((t) => t.status === statusFilter);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h2>Support / Issue Tracker</h2>
        <button
          onClick={logout}
          style={{
            backgroundColor: "#dc2626",
            color: "#ffffff",
            padding: "8px 16px",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* CREATE TICKET */}
      <div style={{ border: "1px solid #ccc", padding: 24, marginBottom: 32 }}>
        <h3 style={{ marginBottom: 16 }}>Create Ticket</h3>

        <div style={{ maxWidth: 500 }}>
          <div style={{ marginBottom: 12 }}>
            <label>Date: </label>
            <input type="date" value={today} disabled style={{ width: "100%" }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Business Unit: </label>
            <select
              value={businessUnit}
              onChange={(e) => setBusinessUnit(e.target.value)}
            >
              <option value="">Select</option>
              {BUSINESS_UNITS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Module: </label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
            >
              <option value="">Select</option>
              {MODULES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Support Type: </label>
            <select
              value={supportType}
              onChange={(e) => setSupportType(e.target.value)}
            >
              <option value="">Select</option>
              {SUPPORT_TYPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <button
            onClick={submitTicket}
            style={{
              backgroundColor: "#16a34a",
              color: "#ffffff",
              padding: "10px 16px",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Submit Ticket
          </button>
        </div>
      </div>

      {/* MY TICKETS */}
      <div style={{ border: "1px solid #ccc", padding: 24 }}>
        <div
          onClick={() => setShowMyTickets(!showMyTickets)}
          style={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>My Tickets</h3>
          <span>{showMyTickets ? "▲" : "▼"}</span>
        </div>

        {/* ✅ STATUS FILTER (ONLY WHEN EXPANDED) */}
        {showMyTickets && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ marginRight: 8 }}>Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {showMyTickets &&
          filteredTickets.map((t) => (
            <div
              key={t.id}
              style={{
                border: "1px solid #999",
                padding: 16,
                marginBottom: 16,
                background: "#f9f9f9",
              }}
            >
              <div><b>Date:</b> {t.date}</div>
              <div><b>Status:</b> {t.status}</div>
              <div><b>Business Unit:</b> {t.businessUnit}</div>
              <div><b>Module:</b> {t.module}</div>
              <div><b>Support Type:</b> {t.supportType}</div>
              <div><b>Description:</b> {t.description}</div>
            </div>
          ))}

        {showMyTickets && filteredTickets.length === 0 && (
          <div style={{ fontSize: 13, color: "#666" }}>
            No tickets found for selected status
          </div>
        )}
      </div>
    </div>
  );
}
