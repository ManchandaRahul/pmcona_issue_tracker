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

  /* ===== STATE ===== */
  const [tickets, setTickets] = useState<any[]>([]);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const logout = () => {
  localStorage.removeItem("user");
  window.location.href = import.meta.env.BASE_URL + "login";
};


  // Form state
  const [businessUnit, setBusinessUnit] = useState("");
  const [module, setModule] = useState("");
  const [supportType, setSupportType] = useState("");
  const [description, setDescription] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  /* ===== CLEAR FORM ON LOAD ===== */
  useEffect(() => {
    setBusinessUnit("");
    setModule("");
    setSupportType("");
    setDescription("");
    setShowMyTickets(false);
  }, []);

  /* ===== LOAD USER TICKETS ===== */
  useEffect(() => {
    const q = query(
      collection(db, "tickets"),
      where("createdBy", "==", user.email)
    );

    return onSnapshot(q, (snap) => {
      setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  /* ===== SUBMIT TICKET ===== */
  const submitTicket = async () => {
    if (!businessUnit || !module || !supportType || !description) {
      alert("Please fill all fields");
      return;
    }

    try {
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

      // Reset form
      setBusinessUnit("");
      setModule("");
      setSupportType("");
      setDescription("");

      // Optionally auto-expand My Tickets
      setShowMyTickets(true);
    } catch (err) {
      console.error(err);
      alert("Failed to create ticket");
    }
  };

  return (
    <div className="p-6">
      {/* ===== CREATE TICKET ===== */}
      <div className="flex justify-end mb-4">
  <button
    onClick={logout}
    className="border px-4 py-1 rounded text-sm hover:bg-gray-100"
  >
    Logout
  </button>
</div>

      <h1 className="text-xl font-semibold mb-4">Create Ticket</h1>

      <div className="space-y-3 max-w-lg">
        <div>
          <label>Date</label>
          <input
            type="date"
            value={today}
            disabled
            className="border w-full px-2 py-1 bg-gray-100"
          />
        </div>

        <div>
          <label>Business Unit</label>
          <select
            value={businessUnit}
            onChange={(e) => setBusinessUnit(e.target.value)}
            className="border w-full px-2 py-1"
          >
            <option value="">Select</option>
            {BUSINESS_UNITS.map((bu) => (
              <option key={bu} value={bu}>{bu}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Module</label>
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="border w-full px-2 py-1"
          >
            <option value="">Select</option>
            {MODULES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Support Type</label>
          <select
            value={supportType}
            onChange={(e) => setSupportType(e.target.value)}
            className="border w-full px-2 py-1"
          >
            <option value="">Select</option>
            {SUPPORT_TYPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border w-full px-2 py-1"
          />
        </div>

        <button
          onClick={submitTicket}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Submit Ticket
        </button>
      </div>

      {/* ===== MY TICKETS (EXPAND / COLLAPSE) ===== */}
      <div className="mt-8 max-w-3xl">
        <div
          onClick={() => setShowMyTickets(!showMyTickets)}
          className="cursor-pointer font-semibold text-lg"
        >
          My Tickets {showMyTickets ? "▲" : "▼"}
        </div>

        {showMyTickets && (
          <div className="mt-3">
            {tickets.length === 0 && (
              <div className="text-gray-500 text-sm">
                No tickets created yet
              </div>
            )}

            {tickets.map((t) => (
              <div
                key={t.id}
                className="border rounded p-3 mb-2 bg-gray-50"
              >
                <div><b>Date:</b> {t.date}</div>
                <div><b>Business Unit:</b> {t.businessUnit}</div>
                <div><b>Module:</b> {t.module}</div>
                <div><b>Support Type:</b> {t.supportType}</div>
                <div><b>Status:</b> {t.status}</div>
                <div><b>Description:</b> {t.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
