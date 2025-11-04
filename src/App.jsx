// src/App.jsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  useLocation,
} from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Universal cart widget (badge + dropdown)
import CartWidget from "./components/CartWidget.jsx";

// Public
import Home from "./pages/ZooHomePage.jsx";
import Login from "./pages/Login.jsx";
import Lost from "./pages/Lost.jsx";
import CAnimals from "./pages/customer/Animals.jsx";
import CTickets from "./pages/customer/Tickets.jsx";
import ExhibitsPage from "./pages/customer/Exhibit.jsx";
import Visit from "./pages/customer/Visit.jsx";
import ZooScheduler from "./pages/customer/ZooScheduler.jsx";
import RequestReceived from "./pages/customer/RequestRecieved.jsx";
import EventDetails from "./pages/customer/EventDetails.jsx";

// Employee/Admin
import Dashboard from "./pages/employee/Dashboard.jsx";
import Animals from "./pages/employee/Animals.jsx";
import Employees from "./pages/employee/Employees.jsx";
import Reports from "./pages/employee/Reports.jsx";
import EmployeeView from "./pages/employee/EmployeeView.jsx";
import EmployeeEdit from "./pages/employee/EmployeeEdit.jsx";
import Events from "./pages/employee/Events.jsx";
import EventView from "./pages/employee/EventView.jsx";
import EventEdit from "./pages/employee/EventEdit.jsx";

// Role landing pages
import Vet from "./pages/employee/Vet.jsx";
import GateAgent from "./pages/employee/GateAgent.jsx";
import Retail from "./pages/employee/Retail.jsx";
import Coordinator from "./pages/employee/Coordinator.jsx";
import Security from "./pages/employee/Security.jsx";

/* ---------- RoleHub (redirect to role dashboard) ---------- */
function RoleHub() {
  const { user } = useAuth();
  if (!user) return null;
  const map = {
    keeper: "/keeper",
    vet: "/vet",
    gate_agent: "/gate",
    ops_manager: "/ops",
    retail: "/retail",
    coordinator: "/coord",
    security: "/security",
    admin: "/admin",
  };
  const dest = map[user.role] || "/dashboard";
  return <Navigate to={dest} replace />;
}

/* ---------- Shared page shell ---------- */
function CardPage({ title, children }) {
  return (
    <div className="page card-page">
      <div className="card-page-inner">
        <h2 className="card-page-title">{title}</h2>
        <div className="card card-page-body">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Keeper Dashboard ---------- */
function KeeperDash() {
  const { token } = useAuth();
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [filter, setFilter] = React.useState(
    () => localStorage.getItem("keeperFilter") || "all"
  );
  const onSetFilter = (k) => {
    setFilter(k);
    localStorage.setItem("keeperFilter", k);
  };

  const fmtDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  const filtered = React.useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return tasks.filter((t) => {
      if (filter === "today")
        return String(t.task_date).slice(0, 10) === todayStr;
      if (filter === "pending") return Number(t.is_complete) === 0;
      if (filter === "done") return Number(t.is_complete) === 1;
      return true;
    });
  }, [tasks, filter]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${api}/api/keeper/my-tasks`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setTasks(await res.json());
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function toggleDone(t) {
    const nextVal = Number(t.is_complete) ? 0 : 1;
    setTasks((prev) =>
      prev.map((x) =>
        x.assignment_id === t.assignment_id
          ? { ...x, is_complete: nextVal }
          : x
      )
    );
    try {
      const res = await fetch(
        `${api}/api/keeper/tasks/${t.assignment_id}/complete`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_complete: nextVal }),
        }
      );
      if (!res.ok) throw new Error("Update failed");
    } catch (e) {
      setTasks((prev) =>
        prev.map((x) =>
          x.assignment_id === t.assignment_id
            ? { ...x, is_complete: Number(!nextVal) }
            : x
        )
      );
      alert(e.message || "Failed to update");
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  return (
    <CardPage title="Keeper Dashboard">
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <strong style={{ marginRight: 4, opacity: 0.85 }}>Filter:</strong>
        {["all", "today", "pending", "done"].map((k) => (
          <button
            key={k}
            type="button"
            className="btn btn-sm"
            onClick={() => onSetFilter(k)}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid #ddd",
              background: filter === k ? "#ffe08a" : "#fff",
              fontWeight: filter === k ? 700 : 500,
              fontSize: 12,
            }}
          >
            {k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.8 }}>
          Total: {tasks.length} • Showing: {filtered.length}
        </div>
      </div>

      {err && (
        <div
          className="error"
          style={{
            marginBottom: 10,
            padding: "10px 12px",
            borderRadius: 10,
            background: "#ffe5e5",
          }}
        >
          {err}
        </div>
      )}

      {loading ? (
        <div>Loading…</div>
      ) : tasks.length === 0 ? (
        <div className="note">
          No tasks yet. Ask your coordinator to assign one.
        </div>
      ) : (
        <div style={{ maxHeight: 420, overflowY: "auto", borderRadius: 10 }}>
          <table
            className="table"
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              background: "#fff",
            }}
          >
            <thead>
              <tr
                style={{
                  position: "sticky",
                  top: 0,
                  background: "#fff3bf",
                  textAlign: "left",
                  fontSize: 13,
                  zIndex: 1,
                }}
              >
                <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                  Date
                </th>
                <th style={{ padding: "12px 14px" }}>Animal</th>
                <th style={{ padding: "12px 14px" }}>Task</th>
                <th style={{ padding: "12px 14px" }}>Notes</th>
                <th style={{ padding: "12px 14px" }}>Done</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr
                  key={t.assignment_id}
                  style={{
                    background: Number(t.is_complete)
                      ? "#eef8f0"
                      : i % 2
                      ? "#fffdf5"
                      : "#ffffff",
                    fontSize: 14,
                  }}
                >
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    {fmtDate(t.task_date)}
                  </td>
                  <td style={{ padding: "10px 12px" }} title={t.animal_name}>
                    {t.animal_name}
                  </td>
                  <td style={{ padding: "10px 12px" }} title={t.task_type || ""}>
                    {t.task_type || "-"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        maxWidth: 520,
                      }}
                      title={t.notes || ""}
                    >
                      {t.notes || "-"}
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(Number(t.is_complete))}
                        onChange={() => toggleDone(t)}
                      />
                      <span style={{ fontSize: 12, opacity: 0.8 }}>
                        {Number(t.is_complete) ? "Done" : "Pending"}
                      </span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardPage>
  );
}

/* ---------- Ops Manager ---------- */
function OpsManagerDash() {
  const { token } = useAuth();
  const [keepers, setKeepers] = React.useState([]);
  const [animals, setAnimals] = React.useState([]);
  const [form, setForm] = React.useState({
    employee_id: "",
    animal_id: "",
    task_date: "",
    task_type: "Feed",
    notes: "",
  });
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    async function load() {
      try {
        const [eRes, aRes] = await Promise.all([
          fetch(`${api}/api/employees?q=&sort=last_name&order=ASC&limit=200`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${api}/api/reports/animals-basic`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const emp = await eRes.json();
        const ani = await aRes.json();
        setKeepers(emp.filter((x) => x.role === "keeper"));
        setAnimals(ani);
      } catch {
        /* ignore */
      }
    }
    load();
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch(`${api}/api/keeper/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Create failed");
      setMsg("Assigned!");
      setForm({
        employee_id: "",
        animal_id: "",
        task_date: "",
        task_type: "Feed",
        notes: "",
      });
    } catch (err) {
      setMsg(err.message || "Failed");
    }
  }

  return (
    <CardPage title="Operations Manager Dashboard">
      <form onSubmit={submit} className="two-col" style={{ gap: 12 }}>
        <div>
          <label>Keeper</label>
          <select
            value={form.employee_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, employee_id: e.target.value }))
            }
            required
          >
            <option value="">Select keeper…</option>
            {keepers.map((k) => (
              <option key={k.employee_id} value={k.employee_id}>
                {k.last_name}, {k.first_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Animal</label>
          <select
            value={form.animal_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, animal_id: e.target.value }))
            }
            required
          >
            <option value="">Select animal…</option>
            {animals.map((a) => (
              <option key={a.animal_id} value={a.animal_id}>
                {a.animal_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Date</label>
          <input
            type="date"
            value={form.task_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, task_date: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label>Task</label>
          <input
            value={form.task_type}
            onChange={(e) =>
              setForm((f) => ({ ...f, task_type: e.target.value }))
            }
          />
        </div>
        <div className="span-2">
          <label>Notes</label>
          <input
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
        <div className="span-2">
          <button className="btn" type="submit">
            Assign Task
          </button>
          {msg && <span style={{ marginLeft: 10 }}>{msg}</span>}
        </div>
      </form>
    </CardPage>
  );
}

function Forbidden() {
  return (
    <div className="page">
      <h2>403 – Forbidden</h2>
      <p>You don’t have permission to view this page.</p>
    </div>
  );
}

/* ---------- Top Nav (container + grouped links + anchored cart) ---------- */
function Nav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="topbar">
      <div className="container nav">
        <div className="nav-inner">
          <div className="nav-left">
            <button
              className={`menu-toggle${menuOpen ? " is-open" : ""}`}
              type="button"
              onClick={toggleMenu}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
            <div className="brand">H-Town Zoo</div>
          </div>

          <div className="nav-right">
            <ul className={`links${menuOpen ? " is-open" : ""}`}>
              {user ? (
                <>
                  <li>
                    <NavLink
                      to="/dashboard"
                      className={({ isActive }) => (isActive ? "active" : "")}
                      onClick={closeMenu}
                    >
                      Dashboard
                    </NavLink>
                  </li>
                  {(user.role === "admin" || user.role === "ops_manager") && (
                    <li>
                      <NavLink
                        to="/employees"
                        className={({ isActive }) => (isActive ? "active" : "")}
                        onClick={closeMenu}
                      >
                        Employees
                      </NavLink>
                    </li>
                  )}
                  {user.role === "admin" && (
                    <li>
                      <NavLink
                        to="/reports"
                        className={({ isActive }) => (isActive ? "active" : "")}
                        onClick={closeMenu}
                      >
                        Reports
                      </NavLink>
                    </li>
                  )}
                  {(user.role === "admin" || user.role === "ops_manager") && (
                    <li>
                      <NavLink
                        to="/events"
                        className={({ isActive }) => (isActive ? "active" : "")}
                        onClick={closeMenu}
                      >
                        Events
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <NavLink
                      to="/role"
                      className={({ isActive }) => (isActive ? "active" : "")}
                      onClick={closeMenu}
                    >
                      My Role
                    </NavLink>
                  </li>
                  <li>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        closeMenu();
                        logout();
                      }}
                      type="button"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <NavLink
                      to="/"
                      className={({ isActive }) => (isActive ? "active" : "")}
                      onClick={closeMenu}
                    >
                      Home
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/visit"
                      className={({ isActive }) => (isActive ? "active" : "")}
                      onClick={closeMenu}
                    >
                      Visit
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/tickets"
                      className={({ isActive }) => (isActive ? "active" : "")}
                      onClick={closeMenu}
                    >
                      Tickets
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/login"
                      className={({ isActive }) => (isActive ? "active" : "")}
                      onClick={closeMenu}
                    >
                      Login
                    </NavLink>
                  </li>
                </>
              )}
            </ul>

            {/* Cart is anchored to this box so the dropdown never runs off-screen */}
            <div className="nav-cart">
              <CartWidget />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- App Routes ---------- */
export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route path="/animals" element={<CAnimals />} />
        <Route path="/tickets" element={<CTickets />} />
        <Route path="/Exhibits" element={<ExhibitsPage />} />
        <Route path="/request" element={<RequestReceived />} />
        <Route path="scheduleEvents" element={<ZooScheduler />} />
        <Route path="/visit" element={<Visit />} />
        <Route path="/visit/:id" element={<EventDetails />} />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/role"
          element={
            <ProtectedRoute>
              <RoleHub />
            </ProtectedRoute>
          }
        />

        {/* Role-specific */}
        <Route
          path="/keeper"
          element={
            <ProtectedRoute roles={["keeper", "admin", "ops_manager"]}>
              <KeeperDash />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vet"
          element={
            <ProtectedRoute roles={["vet", "admin", "ops_manager"]}>
              <Vet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gate"
          element={
            <ProtectedRoute roles={["gate_agent", "admin", "ops_manager"]}>
              <GateAgent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ops"
          element={
            <ProtectedRoute roles={["ops_manager", "admin"]}>
              <OpsManagerDash />
            </ProtectedRoute>
          }
        />
        <Route
          path="/retail"
          element={
            <ProtectedRoute roles={["retail", "admin", "ops_manager"]}>
              <Retail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coord"
          element={
            <ProtectedRoute roles={["coordinator", "admin", "ops_manager"]}>
              <Coordinator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security"
          element={
            <ProtectedRoute roles={["security", "admin", "ops_manager"]}>
              <Security />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <CardPage title="Admin Dashboard">
                Use Employees, Events, Reports in the nav.
              </CardPage>
            </ProtectedRoute>
          }
        />

        {/* Employees */}
        <Route
          path="/employees"
          element={
            <ProtectedRoute roles={["admin", "ops_manager"]}>
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <ProtectedRoute roles={["admin", "ops_manager"]}>
              <EmployeeView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/:id/edit"
          element={
            <ProtectedRoute roles={["admin", "ops_manager"]}>
              <EmployeeEdit />
            </ProtectedRoute>
          }
        />

        {/* Animals (employee) */}
        <Route path="/animalStats" element={<Animals />} />

        {/* Reports */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Events */}
        <Route
          path="/events"
          element={
            <ProtectedRoute roles={["admin", "ops_manager"]}>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/new"
          element={
            <ProtectedRoute roles={["admin", "ops_manager"]}>
              <EventEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute roles={["admin", "ops_manager"]}>
              <EventView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/edit"
          element={
            <ProtectedRoute roles={["admin", "ops_manager"]}>
              <EventEdit />
            </ProtectedRoute>
          }
        />

        <Route path="/403" element={<Forbidden />} />
        <Route path="*" element={<Lost />} />
      </Routes>
    </BrowserRouter>
  );
}
