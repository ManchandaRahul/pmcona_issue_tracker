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




const STATUS_OPTIONS = ["New", "In Progress", "Reassigned", "Closed"];

/* ===== TABLE STYLES ===== */
const thStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  textAlign: "left",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  verticalAlign: "top",
};

/* ===== TICKET ID ===== */
const generateTicketId = (tickets: any[]) => {
  const year = new Date().getFullYear();
  return `PMCONA-${year}-${String(tickets.length + 1).padStart(4, "0")}`;
};

export default function UserDashboard() {
  const [raisedBy, setRaisedBy] = useState("");
  const user = JSON.parse(localStorage.getItem("user")!);
  const logout = () => {
  localStorage.removeItem("user");
  window.location.href = import.meta.env.BASE_URL;
};

  const [tickets, setTickets] = useState<any[]>([]);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  const [businessUnit, setBusinessUnit] = useState("");
  const [module, setModule] = useState("");
  const [supportType, setSupportType] = useState("");
  const [description, setDescription] = useState("");

  const today = new Date().toISOString().slice(0, 10);



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
    if (!raisedBy || !businessUnit || !module || !supportType || !description) {
      alert("Please fill all fields");
      return;
    }

    await addDoc(collection(db, "tickets"), {
      ticketId: generateTicketId(tickets),
      date: today,
      raisedBy,
      businessUnit,
      module,
      supportType,
      description,
      status: "New",
      priority: "Not Set", // default priority
      createdBy: user.email,
      createdAt: new Date(),
    });

    setBusinessUnit("");
    setModule("");
    setSupportType("");
    setDescription("");
    setRaisedBy("");
    setShowMyTickets(true);
  };

  /* ===== STATUS FILTER ONLY (NO DATE FILTER) ===== */
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h2>Support / Issue Tracker</h2>

<button onClick={logout} className="logout-btn">
    Logout
  </button>
      </div>

      {/* CREATE TICKET */}
      <div style={{ border: "1px solid #ccc", padding: 24, marginBottom: 32 }}>
        <h3 style={{ marginBottom: 16 }}>Create Ticket</h3>

        <div style={{ maxWidth: 500 }}>
          <div style={{ marginBottom: 12 }}>
            <label>Date:</label>
            <input type="date" value={today} disabled style={{ width: "100%" }} />
          </div>
          <div style={{ marginBottom: 12 }}>
  <label>Raised By:</label>
  <input
    type="text"
    value={raisedBy}
    onChange={(e) => setRaisedBy(e.target.value)}
    style={{ width: "100%" }}
  />
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
            <select value={module} onChange={(e) => setModule(e.target.value)}>
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
            <label>Description:</label>
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
              color: "#fff",
              padding: "10px 18px",
              border: "none",
              borderRadius: 6,
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
            display: "flex",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
        >
          <h3>My Tickets</h3>
          <span>{showMyTickets ? "▲" : "▼"}</span>
        </div>

        {showMyTickets && (
          <>
            {/* STATUS FILTER */}
            <div style={{ marginBottom: 16 }}>
              Filter by: 
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* LIST VIEW */}
            <table
              width="100%"
              cellPadding={8}
              style={{ borderCollapse: "collapse", marginTop: 12 }}
            >
              <thead style={{ background: "#f3f4f6" }}>
                <tr>
                  <th style={thStyle}>Ticket ID</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Raised By</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Module</th>
                  <th style={thStyle}>Support Type</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Closing Remarks</th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map((t) => (
                  <tr key={t.id}>
                    <td style={tdStyle}>{t.ticketId}</td>
                    <td style={tdStyle}>{t.date}</td>
                    <td style={tdStyle}>{t.raisedBy || "-"}</td>
                    <td style={tdStyle}>{t.status}</td>
                    <td style={tdStyle}>{t.module}</td>
                    <td style={tdStyle}>{t.supportType}</td>
                    <td style={tdStyle}>{t.description}</td>
                    <td style={tdStyle}>
                      {t.status === "Closed"
                        ? t.resolutionRemarks || "-"
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
