import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import * as XLSX from "xlsx";

const STATUSES = ["New", "In Progress", "Reassigned", "Closed"];
const ASSIGNEES = ["Rashmi", "Jayshree"];
const PRIORITIES = ["Low", "Medium", "High"];

export default function AdminDashboard() {
  const admin = JSON.parse(localStorage.getItem("user")!);

  const [tickets, setTickets] = useState<any[]>([]);
  const [priorityFilter, setPriorityFilter] = useState("All");

  useEffect(() => {
    return onSnapshot(collection(db, "tickets"), (snap) => {
      setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const filteredTickets =
    priorityFilter === "All"
      ? tickets
      : tickets.filter((t) => t.priority === priorityFilter);

  const updateStatus = async (ticketId: string, status: string) => {
    const payload: any = { status, updatedAt: new Date() };

    if (status === "Closed") {
      payload.resolvedDate = new Date().toISOString().slice(0, 10);
      payload.resolvedBy = admin.email;
      payload.assignedTo = null;
    }

    if (status === "Reassigned") payload.assignedTo = null;

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

  const downloadExcel = () => {
    const rows = filteredTickets.map((t) => ({
      Date: t.date || "",
      "Created By": t.createdBy || "",
      "Business Unit": t.businessUnit || "",
      Module: t.module || "",
      "Support Type": t.supportType || "",
      Description: t.description || "",
      Status: t.status || "",
      Priority: t.priority || "",
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
      `PM_CONA_Tickets_${priorityFilter}_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = import.meta.env.BASE_URL;
  };

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 600 }}>All Tickets</h1>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ padding: "6px 10px" }}
          >
            <option value="All">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <button
            onClick={downloadExcel}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              padding: "8px 14px",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Download Excel
          </button>

          <button
            onClick={logout}
            style={{
              backgroundColor: "#dc2626",
              color: "#ffffff",
              padding: "8px 14px",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* TICKETS */}
      {filteredTickets.map((t) => (
        <div
          key={t.id}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 6,
            padding: 16,
            marginBottom: 24,
            background: "#ffffff",
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <div><b>Date:</b> {t.date}</div>
            <div><b>User:</b> {t.createdBy}</div>
            <div><b>Business Unit:</b> {t.businessUnit}</div>
            <div><b>Module:</b> {t.module}</div>
            <div><b>Support Type:</b> {t.supportType}</div>
            <div><b>Description:</b> {t.description}</div>
          </div>

          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <label>Status</label><br />
              <select
                value={t.status}
                onChange={(e) => updateStatus(t.id, e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Priority</label><br />
              <select
                value={t.priority || ""}
                onChange={(e) => updatePriority(t.id, e.target.value)}
              >
                <option value="">Select</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {t.status === "Reassigned" && (
            <div style={{ marginTop: 12 }}>
              <label>Reassign To</label><br />
              <select
                value={t.assignedTo || ""}
                onChange={(e) => updateAssignee(t.id, e.target.value)}
              >
                <option value="">Select</option>
                {ASSIGNEES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
