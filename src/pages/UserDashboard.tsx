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

export default function UserDashboard() {
  const user = JSON.parse(localStorage.getItem("user")!);

  const [tickets, setTickets] = useState<any[]>([]);
  const [showMyTickets, setShowMyTickets] = useState(false);

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

// (imports stay the same)

return (
  <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
    {/* HEADER */}
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
      <h2>Support / Issue Tracker</h2>
      <button
  onClick={logout}
  style={{
    backgroundColor: "#dc2626", // red
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
        {/* Date */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Date</label>
          <input
            type="date"
            value={today}
            disabled
            style={{ width: "100%", padding: 6 }}
          />
        </div>

        {/* Business Unit */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Business Unit</label>
          <select
            value={businessUnit}
            onChange={(e) => setBusinessUnit(e.target.value)}
            style={{ width: "100%", padding: 6 }}
          >
            <option value="">Select</option>
            {BUSINESS_UNITS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>

        {/* Module */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Module</label>
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            style={{ width: "100%", padding: 6 }}
          >
            <option value="">Select</option>
            {MODULES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>

        {/* Support Type */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Support Type</label>
          <select
            value={supportType}
            onChange={(e) => setSupportType(e.target.value)}
            style={{ width: "100%", padding: 6 }}
          >
            <option value="">Select</option>
            {SUPPORT_TYPES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              minHeight: 80,
              padding: 8,
              resize: "vertical",
            }}
          />
        </div>

<button
  onClick={submitTicket}
  style={{
    backgroundColor: "#16a34a", // green
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
      <h3
        style={{ cursor: "pointer", marginBottom: 16 }}
        onClick={() => setShowMyTickets(!showMyTickets)}
      >
        My Tickets {showMyTickets ? "▲" : "▼"}
      </h3>

      {showMyTickets &&
        tickets.map((t) => (
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
    </div>
  </div>
);

}
