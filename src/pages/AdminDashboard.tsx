import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";

// 🔹 Allowed status values (Admin controlled)
const STATUSES = ["New", "In Progress", "Closed"];

export default function AdminDashboard() {
  const admin = JSON.parse(localStorage.getItem("user")!);
  const [tickets, setTickets] = useState<any[]>([]);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
const logout = () => {
  localStorage.removeItem("user");
  window.location.href = import.meta.env.BASE_URL + "login";
};


  // 🔄 Load ALL tickets
  useEffect(() => {
    return onSnapshot(collection(db, "tickets"), (snap) => {
      setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // ✅ Update status
  const updateStatus = async (ticketId: string, status: string) => {
    const payload: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "Closed") {
      payload.resolvedDate = new Date().toISOString().slice(0, 10);
      payload.resolvedBy = admin.email;
      payload.resolutionRemarks = remarks[ticketId] || "";
    }

    try {
      await updateDoc(doc(db, "tickets", ticketId), payload);
    } catch (err) {
      console.error(err);
      alert("Failed to update ticket");
    }
  };

  return (
    
    <div className="p-6">
      <div className="flex justify-end mb-4">
  <button
    onClick={logout}
    className="border px-4 py-1 rounded text-sm hover:bg-gray-100"
  >
    Logout
  </button>
</div>

      <h1 className="text-2xl mb-4">All Tickets</h1>

      {tickets.map((t) => (
        <div key={t.id} className="border p-3 mb-3">
          <div>
            <b>Date:</b> {t.date}
          </div>
          <div>
            <b>User:</b> {t.createdBy}
          </div>
          <div>
            <b>Business Unit:</b> {t.businessUnit}
          </div>
          <div>
            <b>Module:</b> {t.module}
          </div>
          <div>
            <b>Support Type:</b> {t.supportType}
          </div>
          <div>
            <b>Description:</b> {t.description}
          </div>

          {/* Status Dropdown */}
          <div className="mt-2">
            <label>Status</label>
            <select
              value={t.status}
              onChange={(e) => updateStatus(t.id, e.target.value)}
              className="border ml-2 px-2 py-1"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Resolution remarks (only when closing) */}
          {t.status !== "Closed" && (
            <div className="mt-2">
              <label>Resolution Remarks</label>
              <textarea
                className="border w-full px-2 py-1"
                rows={2}
                value={remarks[t.id] || ""}
                onChange={(e) =>
                  setRemarks({ ...remarks, [t.id]: e.target.value })
                }
              />
            </div>
          )}

          {/* Closed info */}
          {t.status === "Closed" && (
            <div className="mt-2 text-sm text-gray-700">
              <div>
                <b>Resolved By:</b> {t.resolvedBy}
              </div>
              <div>
                <b>Resolved Date:</b> {t.resolvedDate}
              </div>
              <div>
                <b>Remarks:</b> {t.resolutionRemarks}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
