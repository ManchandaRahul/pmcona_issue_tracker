import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import * as XLSX from "xlsx";

const STATUSES = ["New", "In Progress", "Reassigned", "Closed"];
const ASSIGNEES = ["Rashmi", "Jayshree", "Bhagesh", "Mayur", "Sanjay", "Sonali", "Hemant", "Surresh", "Tejal", "Umesh"];
const PRIORITIES = ["Not Set", "Low", "Medium", "High"];



export default function AdminDashboard() {
  const admin = JSON.parse(localStorage.getItem("user")!);
  const [tickets, setTickets] = useState<any[]>([]);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"card" | "list">("list");

  // Date filter
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Closing remarks (local edit buffer)
  const [closingRemarks, setClosingRemarks] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    return onSnapshot(collection(db, "tickets"), (snap) => {
      setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  /* ================= FILTERS ================= */
  const STATUS_ORDER: Record<string, number> = {
  "New": 1,
  "In Progress": 2,
  "Reassigned": 2,
  "Closed": 3,
};

const filteredTickets = tickets
  .filter((t) => {
    if (priorityFilter !== "All" && t.priority !== priorityFilter) return false;
    if (fromDate && t.date < fromDate) return false;
    if (toDate && t.date > toDate) return false;
    return true;
  })
  .sort((a, b) => {
    const orderA = STATUS_ORDER[a.status] ?? 99;
    const orderB = STATUS_ORDER[b.status] ?? 99;

    // First sort by status priority
    if (orderA !== orderB) return orderA - orderB;

    // Then sort by date (newest first inside same status)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });


  

  /* ================= UPDATE HANDLERS ================= */

const updateStatus = async (ticketId: string, newStatus: string) => {
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) return;

  let remark = closingRemarks[ticketId] || ticket.resolutionRemarks || "";

  // ── Only when changing TO "Reassigned" ──
if (newStatus === "Reassigned") {
    // Still update status, but do NOT add history here
    await updateDoc(doc(db, "tickets", ticketId), {
      status: newStatus,
      updatedAt: new Date(),
    });
    return;
  }

  const historyEntry = {
    status: newStatus,
    remark,
    changedBy: admin.email,
    changedAt: new Date().toISOString(),
  };

  const updatedHistory = [
    ...(ticket.history || []),
    historyEntry,
  ];

  const payload: any = {
    status: newStatus,
    history: updatedHistory,
    updatedAt: new Date(),
  };

  if (newStatus === "Closed") {
    payload.resolvedDate = new Date().toISOString().slice(0, 10);
    payload.resolvedBy = admin.email;
    payload.resolutionRemarks = remark;
    payload.assignedTo = null;
  }

  await updateDoc(doc(db, "tickets", ticketId), payload);


};


  const updatePriority = async (ticketId: string, priority: string) => {
    await updateDoc(doc(db, "tickets", ticketId), {
      priority,
      updatedAt: new Date(),
    });
  };

const updateAssignee = async (ticketId: string, assignee: string) => {
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) return;
  if (ticket.assignedTo === (assignee || null)) return;

  const userRemark = closingRemarks[ticketId] || ticket.resolutionRemarks || "";

  const historyEntry = {
    status: "Reassigned",
    remark: userRemark.trim() 
      ? `Assigned to ${assignee || "nobody"}: ${userRemark}`
      : `Assigned to ${assignee || "nobody"}`,
    changedBy: admin.email,
    changedAt: new Date().toISOString(),
  };
  const updatedHistory = [
    ...(ticket.history || []),
    historyEntry,
  ];

  await updateDoc(doc(db, "tickets", ticketId), {
    status: "Reassigned",     
    assignedTo: assignee,     
    history: updatedHistory,  
    updatedAt: new Date(),
  });
};

  /* ================= EXCEL DOWNLOAD ================= */

  const downloadExcel = () => {
const rows = filteredTickets.map((t) => {
  const latestHistory =
    t.history && t.history.length > 0
      ? t.history[t.history.length - 1]
      : null;

  return {
    "Ticket ID": t.ticketId || "",
    Date: t.date || "",
    "Raised By": t.raisedBy || "",
    "Created By": t.createdBy?.split("@")[0] || "",

    "Business Unit": t.businessUnit || "",
    Module: t.module || "",
    "Support Type": t.supportType || "",
    Description: t.description || "",

    Status: t.status || "",
    Priority: t.priority || "Not Set",

    "Reassigned To":
  t.status === "Reassigned" ? (t.assignedTo || "") : "",


    "Latest Status": latestHistory?.status || "",
    "Latest Remark": latestHistory?.remark || "",
    "Last Updated By": latestHistory?.changedBy?.split("@")[0] || "",
    "Last Updated At": latestHistory?.changedAt || "",

    "Resolved By": t.resolvedBy || "",
    "Resolved Date": t.resolvedDate || "",
  };
});


    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tickets");

    XLSX.writeFile(
      wb,
      `PMCONA_Tickets_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = import.meta.env.BASE_URL;
  };

  /* ================= UI ================= */

  return (
    <div className="page-wrapper">
      {/* HEADER */}
<div className="app-header">
  <h1>All Tickets</h1>

<div style={{
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "nowrap",           // ← the most important change
  flex: 1,
  justifyContent: "flex-end"
}}>
    {/* Date filters */}
    <div style={{ display: "flex", flexDirection: "column" }}>
      <small>From</small>
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className="form-input"
        style={{ width: "auto" }}
      />
    </div>

    <div style={{ display: "flex", flexDirection: "column" }}>
      <small>To</small>
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="form-input"
        style={{ width: "auto" }}
      />
    </div>

    {/* Sort by */}
    Sort by:
    <select
      value={priorityFilter}
      onChange={(e) => setPriorityFilter(e.target.value)}
      className="form-input"
      style={{ width: "auto" }}
    >
      <option value="All">All Priorities</option>
      {PRIORITIES.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>

    {/* View toggle */}
    <div className="view-toggle-wrap">
      <button
        onClick={() => setViewMode("card")}
        className={`view-toggle-btn ${viewMode === "card" ? "active" : "inactive"}`}
      >
        Card View
      </button>
      <button
        onClick={() => setViewMode("list")}
        className={`view-toggle-btn ${viewMode === "list" ? "active" : "inactive"}`}
      >
        List View
      </button>
    </div>

    {/* Action buttons – now next to each other */}
    <button
      onClick={downloadExcel}
      className="btn-blue"
    >
      Download Excel
    </button>

    <button 
      onClick={logout} 
      className="logout-btn"
    >
      Logout
    </button>
  </div>
</div>

      <div style={{ padding: 24 }}>

      {/* ================= CARD VIEW ================= */}
      {viewMode === "card" &&
        filteredTickets.map((t) => (
          <div
            key={t.id}
            className="admin-card"
            data-status={t.status}
          >
            {/* Card Header: Ticket ID + Status badge */}
            <div className="admin-card-header">
              <span className="admin-card-title">{t.ticketId}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 980,
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

            {/* Meta grid */}
            <div className="admin-card-meta">
              <div><span>Date</span>{t.date}</div>
              <div><span>User</span>{t.createdBy?.split("@")[0]}</div>
              <div><span>Raised By</span>{t.raisedBy || "-"}</div>
              <div><span>Business Unit</span>{t.businessUnit}</div>
              <div><span>Module</span>{t.module}</div>
              <div><span>Support Type</span>{t.supportType}</div>
            </div>

            <div style={{ fontSize: 13, color: "#3a3a3c" }}>
              <span style={{ fontSize: 12, color: "#6e6e73", display: "block", marginBottom: 2 }}>Description</span>
              {t.description}
            </div>

            {/* Controls */}
            <div className="admin-card-controls">
              <div>
                <label>Status</label>
                <select
                  value={t.status}
                  onChange={(e) =>{
                    const newStatus = e.target.value; // ── Prevent duplicate logging when status is already "Reassigned" ──
    if (newStatus === t.status) return;                     // no change at all
    if (newStatus === "Reassigned" && t.status === "Reassigned") return; updateStatus(t.id, e.target.value)}}
                  className="form-input"
                  style={{ width: "auto" }}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Priority</label>
                <select
                  value={t.priority || ""}
                  onChange={(e) => updatePriority(t.id, e.target.value)}
                  className="form-input"
                  style={{ width: "auto" }}
                >
                  <option value="">Select</option>
                  {PRIORITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>

              {t.status === "Reassigned" && (
                <div>
                  <label>Reassign</label>
                  <select
                    value={t.assignedTo || ""}
                    onChange={(e) => updateAssignee(t.id, e.target.value)}
                    className="form-input"
                    style={{ width: "auto" }}
                  >
                    <option value="">Select</option>
                    {ASSIGNEES.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Closing Remarks */}
            {/* Closing Remarks */}
<div className="admin-card-remarks">
  <label>Remarks</label>
  <textarea
    rows={3}
    className="form-input"
    value={closingRemarks[t.id] ?? t.resolutionRemarks ?? ""}
    onChange={(e) =>
      setClosingRemarks({
        ...closingRemarks,
        [t.id]: e.target.value,
      })
    }
  />
</div>
{/* <button
  onClick={() =>
    updateStatus(
      t.id,
      pendingStatus[t.id] || t.status
    )
  }
  style={{
    marginTop: 6,
    padding: "4px 10px",
    fontSize: 12,
    background: "#16a34a",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  }}
>
  Save
</button> */}

            {/* History logs */}
            {t.history && t.history.length > 0 && (
              <div className="admin-card-history">
                <b>Status History</b>
                <div style={{ marginTop: 8 }}>
                  {t.history.map((h: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        borderBottom: "1px solid #f2f2f7",
                        padding: "6px 0",
                        fontSize: 13,
                      }}
                    >
                      <b>{h.status}</b> — {h.remark || "-"}
                      <div style={{ color: "#6e6e73", fontSize: 12, marginTop: 2 }}>
                        {h.changedBy?.split("@")[0]} |{" "}
                        {new Date(h.changedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ))}


{/* ================= LIST VIEW ================= */}
{/* ================= LIST VIEW ================= */}
{viewMode === "list" && (
  <div className="table-wrap"
  style={{ 
    overflowX: 'auto',          // enables horizontal scroll
    maxWidth: '100%',           // prevents it from breaking parent
    margin: '0 auto' 
  }}>
    <table width="100%" cellPadding={0}>
      <thead>
        <tr>
          <th className="th-cell">Ticket ID</th>
          <th className="th-cell">Date</th>
          <th className="th-cell">Raised By</th>
          <th className="th-cell">User</th>
          <th className="th-cell">Business Unit</th>
          <th className="th-cell">Module</th>
          <th className="th-cell">Support Type</th>
          <th className="th-cell">Description</th>
          <th className="th-cell">Priority</th>
          <th className="th-cell">Remarks</th>
          <th className="th-cell">Status</th>
        </tr>
      </thead>

      <tbody>
        {filteredTickets.map((t) => (
<tr key={t.id}>
  <td className="td-cell" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{t.ticketId}</td>
  <td className="td-cell" style={{ whiteSpace: "nowrap" }}>{t.date}</td>
  <td className="td-cell">{t.raisedBy || "-"}</td>
  <td className="td-cell">{t.createdBy?.split("@")[0]}</td>
  <td className="td-cell">{t.businessUnit}</td>
  <td className="td-cell">{t.module}</td>
  <td className="td-cell">{t.supportType}</td>

  <td className="td-cell" style={{ maxWidth: 240, whiteSpace: "pre-wrap" }}>
    {t.description}
  </td>

  <td className="td-cell">
    <select
      value={t.priority || "Not Set"}
      onChange={(e) => updatePriority(t.id, e.target.value)}
      className="form-input"
      style={{ width: "auto", minWidth: 90 }}
    >
      {PRIORITIES.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  </td>

  {/* Fixed remarks cell */}
  <td className="td-cell" style={{ minWidth: 200 }}>
    <textarea
      rows={3}
      className="form-input"
      value={closingRemarks[t.id] ?? t.resolutionRemarks ?? ""}
      onChange={(e) =>
        setClosingRemarks({
          ...closingRemarks,
          [t.id]: e.target.value,
        })
      }
    />
  </td>

  <td className="td-cell" style={{ minWidth: 150 }}>
    <select
      value={t.status}
      onChange={(e) => updateStatus(t.id, e.target.value)}
      className="form-input"
      style={{ width: "auto", minWidth: 120 }}
    >
      {STATUSES.map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>

    {t.status === "Reassigned" && (
      <div style={{ marginTop: 6 }}>
        <select
          value={t.assignedTo || ""}
          onChange={(e) => updateAssignee(t.id, e.target.value)}
          className="form-input"
        >
          <option value="">Select Assignee</option>
          {ASSIGNEES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
    )}
  </td>
</tr>
        ))}
      </tbody>
    </table>
  </div>
)}

      </div>
    </div>
  );
}