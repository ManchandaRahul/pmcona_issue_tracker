import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth"; // ← ADD THIS LINE
import type { User } from "firebase/auth";  // ← use 'type' import for types only
import { auth } from "../auth/auth";  // this is correct!

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

const InfoIcon = ({ text }: { text: string }) => (
  <span
    title={text}
    style={{
      marginLeft: 6,
      cursor: "help",
      color: "#6b7280",
      fontSize: 12,
      fontWeight: 600,
    }}
  >
    ℹ
  </span>
);

export default function UserDashboard() {
  const [raisedBy, setRaisedBy] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null"); // ← safer than !
  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = import.meta.env.BASE_URL;
  };

  const [tickets, setTickets] = useState<any[]>([]);
  const [showMyTickets, setShowMyTickets] = useState(true); // ← changed to true by default
  const [statusFilter, setStatusFilter] = useState("All");
  const [openHistory, setOpenHistory] = useState<string | null>(null);

  const [businessUnit, setBusinessUnit] = useState("");
  const [module, setModule] = useState("");
  const [supportType, setSupportType] = useState("");
  const [description, setDescription] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const [submitMessage, setSubmitMessage] = useState(false);

  // NEW STATES FOR VISIBILITY
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketError, setTicketError] = useState<string | null>(null);

useEffect(() => {
  const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: User | null) => {
    console.log("Firebase auth state:", firebaseUser ? "Logged in" : "Not logged in");

    if (firebaseUser && firebaseUser.email) {
      console.log("Real Firebase user:", firebaseUser.email, firebaseUser.uid);

      const q = query(
        collection(db, "tickets"),
        where("createdBy", "==", firebaseUser.email)
      );

      const unsubscribeSnapshot = onSnapshot(q,
        (snap) => {
          console.log("Tickets loaded successfully:", snap.size);
          setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoadingTickets(false);
        },
        (err) => {
          console.error("Firestore snapshot error:", err.code, err.message);
          setTicketError(err.message || "Failed to load tickets");
          setLoadingTickets(false);
        }
      );

      return () => unsubscribeSnapshot();
    } else {
      setTicketError("No user logged in. Please login again.");
      setLoadingTickets(false);
    }
  });

  return unsubscribeAuth;
}, []); // Empty dependency array - only run once on mount

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
      priority: "Not Set",
      createdBy: user.email,
      createdAt: new Date(),
    });

    // Reset form
    setBusinessUnit("");
    setModule("");
    setSupportType("");
    setDescription("");
    setRaisedBy("");
    setShowMyTickets(true); // auto-expand after submit

    // Show success message for 7 seconds
    setSubmitMessage(true);
    setTimeout(() => {
      setSubmitMessage(false);
    }, 7000);
  };

  /* ===== STATUS FILTER ONLY (NO DATE FILTER) ===== */
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="page-wrapper">
      {/* HEADER */}
      <div className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h2 style={{ margin: 0 }}>Support / Issue Tracker</h2>
        </div>

        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        {/* CREATE TICKET */}
        <div className="card">
          <h3>Create Ticket</h3>

          <div style={{ maxWidth: 500 }}>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Date:</label>
              <input type="date" value={today} disabled className="form-input" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">
                <InfoIcon text="Name of the person who raised this issue" />
                Raised By:
              </label>
              <input
                type="text"
                value={raisedBy}
                onChange={(e) => setRaisedBy(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="form-label">
                <InfoIcon text="Select the business unit where the issue occurred" />
                Business Unit:
              </label>
              <select
                value={businessUnit}
                onChange={(e) => setBusinessUnit(e.target.value)}
                className="form-input"
              >
                <option value="">Select</option>
                {BUSINESS_UNITS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="form-label">
                <InfoIcon text="Select the module related to this issue" />
                Module:
              </label>
              <select value={module} onChange={(e) => setModule(e.target.value)} className="form-input">
                <option value="">Select</option>
                {MODULES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="form-label">
                <InfoIcon text="Select the type of support required" />
                Support Type:
              </label>
              <select
                value={supportType}
                onChange={(e) => setSupportType(e.target.value)}
                className="form-input"
              >
                <option value="">Select</option>
                {SUPPORT_TYPES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label">
                <InfoIcon text="Provide detailed description of the issue" />
                Description:
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ position: "relative", display: "inline-block" }}>
              <button
                onClick={submitTicket}
                className="btn-green"
                disabled={submitMessage}
              >
                Submit Ticket
              </button>

              {submitMessage && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    marginTop: "8px",
                    padding: "8px 16px",
                    background: "#10b981",
                    color: "white",
                    fontSize: "0.9rem",
                    borderRadius: "8px",
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    zIndex: 10,
                    animation: "fadeInOut 7s forwards",
                  }}
                >
                  Ticket submitted successfully!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MY TICKETS - FIXED VERSION */}
        <div className="card">
          <div
            onClick={() => setShowMyTickets(!showMyTickets)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <h3 style={{ margin: 0 }}>My Tickets</h3>
            <span style={{ color: "#6e6e73" }}>{showMyTickets ? "▲" : "▼"}</span>
          </div>

          {showMyTickets ? (
            <>
              {/* STATUS FILTER */}
              <div style={{ marginBottom: 16, marginTop: 20 }}>
                Filter by: 
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-input"
                  style={{ width: "auto", marginLeft: 8 }}
                >
                  <option value="All">All Status</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              {loadingTickets ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                  Loading your tickets...
                </div>
              ) : ticketError ? (
                <div style={{ padding: "20px", color: "red", textAlign: "center" }}>
                  Error: {ticketError}
                </div>
              ) : tickets.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                  No tickets found. Create one above!
                </div>
              ) : (
                <>
                  {/* RESPONSIVE STYLES */}
                  <style>{`
                    .tickets-cards { display: none; }
                    @media (max-width: 768px) {
                      .tickets-table { display: none; }
                      .tickets-cards { display: block; }
                    }
                  `}</style>

                  {/* LIST VIEW */}
                  <table
                    className="tickets-table"
                    width="100%"
                    cellPadding={8}
                    style={{ borderCollapse: "collapse", marginTop: 12 }}
                  >
                    <thead style={{ background: "#f3f4f6" }}>
                      <tr>
                        <th style={thStyle}>Ticket ID</th>
                        <th style={thStyle} title="Date the ticket was created">Date</th>
                        <th style={thStyle} title="Person who reported the issue">Raised By</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Assigned To</th>
                        <th style={thStyle}>Business Unit</th>
                        <th style={thStyle} title="Module related to the issue">Module</th>
                        <th style={thStyle} title="Type of support required">Support Type</th>
                        <th style={thStyle} title="Description provided by the user">Description</th>
                        <th style={thStyle}>Remarks</th>
                        <th style={thStyle} title="Complete log of status updates and remarks">
                          Status and log messages
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredTickets.map((t) => (
                        <>
                          {/* MAIN ROW */}
                          <tr key={t.id}>
                            <td style={tdStyle}>{t.ticketId}</td>
                            <td style={tdStyle}>{t.date}</td>
                            <td style={tdStyle}>{t.raisedBy || "-"}</td>
                            <td style={tdStyle}>{t.status}</td>
                            <td style={tdStyle}>
                              {t.assignedTo || "—"}
                            </td>
                            <td style={tdStyle}>{t.businessUnit || "-"}</td>
                            <td style={tdStyle}>{t.module}</td>
                            <td style={tdStyle}>{t.supportType}</td>
                            <td style={tdStyle}>{t.description}</td>
                            <td style={tdStyle}>
                              {t.status === "Closed" ? t.resolutionRemarks || "-" : "-"}
                            </td>
                            <td style={tdStyle}>
                              {t.history && t.history.length > 0 ? (
                                <>
                                  <div>
                                    <b>{t.history[t.history.length - 1].status}</b>:{" "}
                                    {t.history[t.history.length - 1].remark || "-"}
                                  </div>

                                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                                    {t.history.length} updates
                                  </div>

                                  <button
                                    onClick={() =>
                                      setOpenHistory(openHistory === t.id ? null : t.id)
                                    }
                                    style={{
                                      marginTop: 4,
                                      fontSize: 12,
                                      color: "#2563eb",
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      padding: 0,
                                    }}
                                  >
                                    {openHistory === t.id ? "Hide history" : "View history"}
                                  </button>
                                </>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>

                          {/* EXPANDABLE HISTORY ROW */}
                          {openHistory === t.id && t.history && (
                            <tr>
                              <td
                                colSpan={11}
                                style={{
                                  background: "#f9fafb",
                                  padding: 12,
                                }}
                              >
                                {t.history.map((h: any, index: number) => (
                                  <div
                                    key={index}
                                    style={{
                                      borderLeft: "3px solid #2563eb",
                                      paddingLeft: 10,
                                      marginBottom: 8,
                                    }}
                                  >
                                    <div style={{ fontWeight: 600 }}>{h.status}</div>
                                    <div style={{ fontSize: 13 }}>{h.remark || "-"}</div>
                                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                                      {h.changedBy?.split("@")[0]} •{" "}
                                      {new Date(h.changedAt).toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>

                  {/* MOBILE CARD VIEW */}
                  <div className="tickets-cards" style={{ marginTop: 12 }}>
                    {filteredTickets.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 10,
                          padding: 16,
                          marginBottom: 14,
                          backgroundColor: "#fff",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                        }}
                      >
                        {/* Top row: Ticket ID + Status */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{t.ticketId}</span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "3px 10px",
                              borderRadius: 20,
                              backgroundColor:
                                t.status === "New" ? "#dbeafe" :
                                t.status === "In Progress" ? "#fef9c3" :
                                t.status === "Reassigned" ? "#ede9fe" :
                                t.status === "Closed" ? "#dcfce7" : "#f3f4f6",
                              color:
                                t.status === "New" ? "#1d4ed8" :
                                t.status === "In Progress" ? "#b45309" :
                                t.status === "Reassigned" ? "#7c3aed" :
                                t.status === "Closed" ? "#16a34a" : "#374151",
                            }}
                          >
                            {t.status}
                          </span>
                        </div>

                        {/* Details */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 13, color: "#374151", marginBottom: 10 }}>
                          <div><span style={{ color: "#6b7280", fontWeight: 500 }}>Date: </span>{t.date}</div>
                          <div><span style={{ color: "#6b7280", fontWeight: 500 }}>Raised By: </span>{t.raisedBy || "-"}</div>
                          <div><strong style={{ color: "#6b7280" }}>Business Unit:</strong> {t.businessUnit || "-"}</div>
                          <div><span style={{ color: "#6b7280", fontWeight: 500 }}>Module: </span>{t.module}</div>
                          <div><span style={{ color: "#6b7280", fontWeight: 500 }}>Support Type: </span>{t.supportType}</div>
                        </div>

                        <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
                          <span style={{ color: "#6b7280", fontWeight: 500 }}>Description: </span>{t.description}
                        </div>

                        <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
                          <span style={{ color: "#6b7280", fontWeight: 500 }}>Remarks: </span>
                          {t.status === "Closed" ? t.resolutionRemarks || "-" : "-"}
                        </div>

                        {/* History */}
                        {t.history && t.history.length > 0 ? (
                          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 8, marginTop: 4 }}>
                            <div style={{ fontSize: 13, marginBottom: 4 }}>
                              <b>{t.history[t.history.length - 1].status}</b>:{" "}
                              {t.history[t.history.length - 1].remark || "-"}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 12, color: "#6b7280" }}>{t.history.length} updates</span>
                              <button
                                onClick={() => setOpenHistory(openHistory === t.id ? null : t.id)}
                                style={{ fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                              >
                                {openHistory === t.id ? "Hide history" : "View history"}
                              </button>
                            </div>
                            {openHistory === t.id && (
                              <div style={{ marginTop: 10, backgroundColor: "#f9fafb", borderRadius: 8, padding: 10 }}>
                                {t.history.map((h: any, index: number) => (
                                  <div key={index} style={{ borderLeft: "3px solid #2563eb", paddingLeft: 10, marginBottom: 8 }}>
                                    <div style={{ fontWeight: 600 }}>{h.status}</div>
                                    <div style={{ fontSize: 13 }}>{h.remark || "-"}</div>
                                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                                      {h.changedBy?.split("@")[0]} • {new Date(h.changedAt).toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>No history yet</div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ padding: "16px", color: "#6b7280", textAlign: "center" }}>
              Click to expand and view your tickets
            </div>
          )}
        </div>
      </div>
    </div>
  );
}