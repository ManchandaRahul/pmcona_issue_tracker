import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";

const STATUSES = ["New", "In Progress", "Reassigned", "Closed"];
const ASSIGNEES = ["Rashmi", "Jayshree"];
const PRIORITIES = ["Low", "Medium", "High"];

const statusColor = (status: string) => {
  if (status === "Closed") return "#16a34a";
  if (status === "In Progress") return "#2563eb";
  if (status === "Reassigned") return "#d97706";
  return "#6b7280";
};

const priorityColor = (p: string) => {
  if (p === "High") return "#dc2626";
  if (p === "Medium") return "#d97706";
  return "#16a34a";
};

export default function AdminDashboard() {
  const admin = JSON.parse(localStorage.getItem("user")!);
  const [tickets, setTickets] = useState<any[]>([]);
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  useEffect(() => {
    return onSnapshot(collection(db, "tickets"), (snap) => {
      setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const updateStatus = async (ticketId: string, status: string) => {
    const payload: any = { status, updatedAt: new Date() };

    if (status === "Closed") {
      payload.resolvedDate = new Date().toISOString().slice(0, 10);
      payload.resolvedBy = admin.email;
      payload.resolutionRemarks = remarks[ticketId] || "";
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

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = import.meta.env.BASE_URL;
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600 }}>All Tickets</h1>
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

      {tickets.map((t) => (
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

          <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
            <div>
              <label>Status</label><br />
              <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span
                style={{
                  marginLeft: 8,
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  color: "#fff",
                  background: statusColor(t.status),
                }}
              >
                {t.status}
              </span>
            </div>

            <div>
              <label>Priority</label><br />
              <select value={t.priority || ""} onChange={(e) => updatePriority(t.id, e.target.value)}>
                <option value="">Select</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {t.priority && (
                <span
                  style={{
                    marginLeft: 8,
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    color: "#fff",
                    background: priorityColor(t.priority),
                  }}
                >
                  {t.priority}
                </span>
              )}
            </div>
          </div>

          {t.status === "Reassigned" && (
            <div style={{ marginBottom: 12 }}>
              <label>Reassign To</label><br />
              <select value={t.assignedTo || ""} onChange={(e) => updateAssignee(t.id, e.target.value)}>
                <option value="">Select</option>
                {ASSIGNEES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          )}

          {t.status !== "Closed" && (
            <div>
              <label>Resolution Remarks</label>
              <textarea
                style={{ width: "100%", marginTop: 6 }}
                rows={2}
                value={remarks[t.id] || ""}
                onChange={(e) => setRemarks({ ...remarks, [t.id]: e.target.value })}
              />
            </div>
          )}

          {t.status === "Closed" && (
            <div style={{ marginTop: 12, fontSize: 14 }}>
              <div><b>Resolved By:</b> {t.resolvedBy}</div>
              <div><b>Resolved Date:</b> {t.resolvedDate}</div>
              <div><b>Remarks:</b> {t.resolutionRemarks}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
