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
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

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

  const filteredTickets = tickets.filter((t) => {
    if (priorityFilter !== "All" && t.priority !== priorityFilter) return false;
    if (fromDate && t.date < fromDate) return false;
    if (toDate && t.date > toDate) return false;
    return true;
  });

  /* ================= UPDATE HANDLERS ================= */

  const updateStatus = async (ticketId: string, status: string) => {
    const payload: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "Closed") {
      payload.resolvedDate = new Date().toISOString().slice(0, 10);
      payload.resolvedBy = admin.email;
      payload.resolutionRemarks = closingRemarks[ticketId] || "";
      payload.assignedTo = null;
    }

    if (status === "Reassigned") {
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
    await updateDoc(doc(db, "tickets", ticketId), {
      assignedTo: assignee,
      updatedAt: new Date(),
    });
  };

  /* ================= EXCEL DOWNLOAD ================= */

  const downloadExcel = () => {
    const rows = filteredTickets.map((t) => ({
      "Ticket ID": t.ticketId || "",
      Date: t.date || "",
      "Created By": t.createdBy || "",
      "Business Unit": t.businessUnit || "",
      Module: t.module || "",
      "Support Type": t.supportType || "",
      Description: t.description || "",
      Status: t.status || "",
      Priority: t.priority || "Not Set",
      "Assigned To": t.assignedTo || "",
      "Resolved By": t.resolvedBy || "",
      "Resolved Date": t.resolvedDate || "",
      "Resolution Remarks": t.resolutionRemarks || "",
    }));

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
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 24 }}>All Tickets</h1>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Date Filter */}
         <div style={{ display: "flex", flexDirection: "column" }}>
  <small>From</small>
  <input
    type="date"
    value={fromDate}
    onChange={(e) => setFromDate(e.target.value)}
  />
</div>

<div style={{ display: "flex", flexDirection: "column" }}>
  <small>To</small>
  <input
    type="date"
    value={toDate}
    onChange={(e) => setToDate(e.target.value)}
  />
</div>
          {/* Priority Filter */}
          Sort by:
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
<option value="All">All Priorities</option>
{PRIORITIES.map((p) => (
  <option key={p} value={p}>{p}</option>
))}

          </select>

          {/* View Toggle */}
          <button
            onClick={() => setViewMode("card")}
            style={{
              padding: "6px 12px",
              border: "1px solid #ccc",
              background: viewMode === "card" ? "#e5e7eb" : "#fff",
            }}
          >
            Card View
          </button>

          <button
            onClick={() => setViewMode("list")}
            style={{
              padding: "6px 12px",
              border: "1px solid #ccc",
              background: viewMode === "list" ? "#e5e7eb" : "#fff",
            }}
          >
            List View
          </button>

          {/* Actions */}
          <button
            onClick={downloadExcel}
            style={{
              background: "#2563eb",
              color: "#fff",
              padding: "8px 14px",
              border: "none",
            }}
          >
            Download Excel
          </button>

<button onClick={logout} className="logout-btn">
  Logout
</button>

        </div>
      </div>

      {/* ================= CARD VIEW ================= */}
      {viewMode === "card" &&
        filteredTickets.map((t) => (
          <div
            key={t.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 6,
              padding: 16,
              marginBottom: 20,
              background: "#fff",
            }}
          >
            <div><b>Ticket ID:</b> {t.ticketId}</div>
            <div><b>Date:</b> {t.date}</div>
            <div><b>User:</b> {t.createdBy?.split("@")[0]}
</div>
            <div><b>Business Unit:</b> {t.businessUnit}</div>
            <div><b>Module:</b> {t.module}</div>
            <div><b>Support Type:</b> {t.supportType}</div>
            <div><b>Description:</b> {t.description}</div>

            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <div>
                <label>Status</label><br />
                <select
                  value={t.status}
                  onChange={(e) =>
                    updateStatus(t.id, e.target.value)
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Priority</label><br />
                <select
                  value={t.priority || ""}
                  onChange={(e) =>
                    updatePriority(t.id, e.target.value)
                  }
                >
                  <option value="">Select</option>
                  {PRIORITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>

              {t.status === "Reassigned" && (
                <div>
                  <label>Reassign</label><br />
                  <select
                    value={t.assignedTo || ""}
                    onChange={(e) =>
                      updateAssignee(t.id, e.target.value)
                    }
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
<div style={{ marginTop: 12 }}>
  <label>Closing Remarks</label>

  {t.status === "Closed" ? (
    <div style={{ padding: "6px 0", color: "#374151" }}>
      {t.resolutionRemarks || "-"}
    </div>
  ) : (
    <textarea
      rows={2}
      style={{ width: "100%" }}
      value={closingRemarks[t.id] || ""}
      onChange={(e) =>
        setClosingRemarks({
          ...closingRemarks,
          [t.id]: e.target.value,
        })
      }
    />
  )}
</div>


          </div>
        ))}


{/* ================= LIST VIEW ================= */}
{/* ================= LIST VIEW ================= */}
{viewMode === "list" && (
  <table
    width="100%"
    cellPadding={8}
    style={{
      borderCollapse: "collapse",
      background: "#ffffff",
      border: "1px solid #d1d5db",
    }}
  >
    <thead style={{ background: "#f3f4f6" }}>
      <tr>
        <th style={{ border: "1px solid #d1d5db" }}>Ticket ID</th>
        <th style={{ border: "1px solid #d1d5db" }}>Date</th>
        <th style={{ border: "1px solid #d1d5db" }}>User</th>
        <th style={{ border: "1px solid #d1d5db" }}>Business Unit</th>
        <th style={{ border: "1px solid #d1d5db" }}>Module</th>
        <th style={{ border: "1px solid #d1d5db" }}>Support Type</th>
        <th style={{ border: "1px solid #d1d5db" }}>Description</th>
        <th style={{ border: "1px solid #d1d5db" }}>Status</th>
        <th style={{ border: "1px solid #d1d5db" }}>Priority</th>
        <th style={{ border: "1px solid #d1d5db" }}>Closing Remarks</th>
      </tr>
    </thead>

    <tbody>
      {filteredTickets.map((t) => (
        <tr key={t.id}>
          <td style={{ border: "1px solid #e5e7eb" }}>{t.ticketId}</td>
          <td style={{ border: "1px solid #e5e7eb" }}>{t.date}</td>
          <td style={{ border: "1px solid #e5e7eb" }}>{t.createdBy?.split("@")[0]}
</td>
          <td style={{ border: "1px solid #e5e7eb" }}>{t.businessUnit}</td>
          <td style={{ border: "1px solid #e5e7eb" }}>{t.module}</td>
          <td style={{ border: "1px solid #e5e7eb" }}>{t.supportType}</td>

          {/* DESCRIPTION */}
          <td
            style={{
              border: "1px solid #e5e7eb",
              maxWidth: 320,
              whiteSpace: "pre-wrap",
            }}
          >
            {t.description}
          </td>

          {/* STATUS */}
         <td style={{ border: "1px solid #e5e7eb" }}>
  <select
    value={t.status}
    onChange={(e) => updateStatus(t.id, e.target.value)}
  >
    {STATUSES.map((s) => (
      <option key={s}>{s}</option>
    ))}
  </select>

  {/* REASSIGN INLINE */}
  {t.status === "Reassigned" && (
    <div style={{ marginTop: 6 }}>
      <select
        value={t.assignedTo || ""}
        onChange={(e) =>
          updateAssignee(t.id, e.target.value)
        }
        style={{ width: "100%" }}
      >
        <option value="">Select Assignee</option>
        {ASSIGNEES.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  )}
</td>

          

          {/* PRIORITY */}
          <td style={{ border: "1px solid #e5e7eb" }}>
<select
  value={t.priority || "Not Set"}
  onChange={(e) => updatePriority(t.id, e.target.value)}
>
  {PRIORITIES.map((p) => (
    <option key={p} value={p}>
      {p}
    </option>
  ))}
</select>

          </td>

          {/* CLOSING REMARKS */}
          <td style={{ border: "1px solid #e5e7eb", minWidth: 220 }}>
            {t.status !== "Closed" ? (
              <textarea
                rows={2}
                style={{ width: "100%" }}
                value={closingRemarks[t.id] || ""}
                onChange={(e) =>
                  setClosingRemarks({
                    ...closingRemarks,
                    [t.id]: e.target.value,
                  })
                }
              />
            ) : (
              t.resolutionRemarks || "-"
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)}


    </div>
  );
}
