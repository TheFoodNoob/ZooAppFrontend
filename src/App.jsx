import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  useLocation,
  useParams,
  Link,
} from "react-router-dom";
import { api } from "./api";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Universal cart widget (badge + dropdown)
import CartWidget from "./components/CartWidget.jsx";

// Public
import Home from "./pages/ZooHomePage.jsx";
import Mission from "./pages/about/Mission.jsx";
import Conservation from "./pages/about/Conservation.jsx";
import Contact from "./pages/about/Contact.jsx";
import Donate from "./pages/customer/Donate.jsx";
import CustomerLogin from "./pages/customer/CustomerLogin.jsx";
import CustomerRegister from "./pages/customer/Register.jsx";
import StaffLogin from "./pages/employee/StaffLogin";
import Lost from "./pages/Lost.jsx";
import CAnimals from "./pages/customer/Animals.jsx";
import CTickets from "./pages/customer/Tickets.jsx";
import ExhibitsPage from "./pages/customer/Exhibit.jsx";
import Visit from "./pages/customer/Visit.jsx";
import ZooScheduler from "./pages/customer/ZooScheduler.jsx";
import RequestReceived from "./pages/customer/RequestRecieved.jsx";
import EventDetails from "./pages/customer/EventDetails.jsx";
import Forgot from "./pages/customer/Forgot.jsx";
import Reset from "./pages/customer/Reset.jsx";
import StaffForgot from "./pages/employee/StaffForgot.jsx";
import StaffReset from "./pages/employee/StaffReset.jsx";
import Memberships from "./pages/customer/Memberships.jsx";
import MembershipCheckout from "./pages/customer/MembershipCheckout.jsx";
import MembershipConfirmation from "./pages/customer/MembershipConfirmation.jsx";
import MyAccount from "./pages/customer/MyAccount.jsx";
import AccountPosReceipt from "./pages/customer/AccountPosReceipt.jsx";
import AccountOrderDetail from "./pages/customer/AccountOrderDetail.jsx";
import AccountMembershipDetail from "./pages/customer/AccountMembershipDetail.jsx";
import AccountDonationDetail from "./pages/customer/AccountDonationDetail.jsx";

/* Used for both customer email-verify and the public order OTP verify step */
import VerifyFromToken from "./pages/customer/VerifyFromToken.jsx";
import VerifySent from "./pages/customer/VerifySent.jsx";
import Checkout from "./pages/customer/Checkout.jsx";
import OrderReceipt from "./pages/customer/OrderReceipt.jsx";
import OrderLookup from "./pages/customer/OrderLookup.jsx";
import GiftShop from "./pages/customer/GiftShop.jsx";
import Food from "./pages/customer/Food.jsx";


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
import Feedings from "./pages/employee/Feedings.jsx";
import FeedingsView from "./pages/employee/FeedingsView.jsx";
import Orders from "./pages/employee/Orders.jsx";

// Role landing pages
import Vet from "./pages/employee/Vet.jsx";
import GateAgent from "./pages/employee/GateAgent.jsx";
import Retail from "./pages/employee/Retail.jsx";
import Coordinator from "./pages/employee/Coordinator.jsx";
import Security from "./pages/employee/Security.jsx";
import RolePage from "./pages/employee/EmployeeByRole.jsx";
import VetVisitsPage from "./pages/employee/VetVisit.jsx";
import VetVisitEdit from "./pages/employee/VisitEdit.jsx";
import TicketStats from "./pages/employee/Tickets.jsx";
import AnimalView from "./pages/employee/AnimalView.jsx";
import AnimalEdit from "./pages/employee/AnimalEdit.jsx";
import FeedingsEdit from "./pages/employee/FeedingsEdit.jsx";
import VetVisitView from "./pages/employee/VisitView.jsx";

/* ---------- Any-employee roles helper ---------- */
const ANY_EMP = [
  "keeper",
  "vet",
  "gate_agent",
  "ops_manager",
  "retail",
  "coordinator",
  "security",
  "admin",
];

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

/* helper wrappers to block login pages when already authenticated */
function RedirectIfAuthed({ children }) {
  const { user } = useAuth();

  if (!user) return children;

  if (user.role === "customer") {
    return <Navigate to="/account" replace />;
  }

  // staff
  return <Navigate to="/dashboard" replace />;
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
      <div>
        <ul>
          <li>
            <Link to="/staff/animals">animal directory</Link>
          </li>
          <li>
            <Link to="/feedings">view feeding logs</Link>
          </li>
          <li>
            <Link to="/vetvisit">view vet appointments</Link>
          </li>
        </ul>
      </div>
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

/* ---------- Top Nav ---------- */
function Nav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef(null);
  const location = useLocation();

  // Distinguish staff vs customer
  const isCustomer = user && user.role === "customer";
  const isStaff =
    user && user.role !== "customer" && ANY_EMP.includes(user.role);

  React.useEffect(() => {
    function onDocClick(e) {
      if (!btnRef.current) return;
      const anchor = btnRef.current.closest(".nav-anchor");
      if (anchor && !anchor.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  React.useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // STAFF NAV LINKS
  const StaffLinks = ({ onClick }) => (
    <>
      <li>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={onClick}
        >
          Dashboard
        </NavLink>
      </li>
      {(user.role === "admin" || user.role === "ops_manager") && (
        <li>
          <NavLink
            to="/employees"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={onClick}
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
            onClick={onClick}
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
            onClick={onClick}
          >
            Events
          </NavLink>
        </li>
      )}
      {["admin", "ops_manager", "gate_agent"].includes(user.role) && (
        <li>
          {/* Staff Orders now lives at /staff/orders */}
          <NavLink
            to="/staff/orders"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={onClick}
          >
            Orders
          </NavLink>
        </li>
      )}

      <li>
        <NavLink
          to="/role"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={onClick}
        >
          My Role
        </NavLink>
      </li>
      <li>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={() => {
            setOpen(false);
            logout();
          }}
        >
          Logout
        </button>
      </li>
    </>
  );

  // PUBLIC/CUSTOMER NAV LINKS
   const PublicLinks = ({ onClick }) => (
    <>
      <li>
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={onClick}
        >
          Home
        </NavLink>
      </li>

      <li>
        <NavLink
          to="/visit"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={onClick}
        >
          Visit
        </NavLink>
      </li>

      <li>
        <NavLink
          to="/tickets"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={onClick}
        >
          Tickets
        </NavLink>
      </li>

      {/* NEW: Exhibits link (desktop + mobile share this) */}
      <li>
        <NavLink
          to="/Exhibits"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={onClick}
        >
          Exhibits
        </NavLink>
      </li>

      <li>
        <NavLink
          to="/memberships"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={onClick}
        >
          Memberships
        </NavLink>
      </li>

      <li>
        <NavLink
          to="/food"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={onClick}
        >
          Food
        </NavLink>
      </li>

      <li>
        <NavLink
          to="/gift-shop"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={onClick}
        >
          Gift Shop
        </NavLink>
      </li>

      {/* Always show My Account; route is protected so
          logged-out users are redirected to /login */}
      <li>
        <NavLink
          to="/account"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={onClick}
        >
          My Account
        </NavLink>
      </li>

      {isCustomer ? (
        <li>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            Logout
          </button>
        </li>
      ) : (
        <li>
          <NavLink
            to="/login"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={onClick}
          >
            Login
          </NavLink>
        </li>
      )}
    </>
  );

  return (
    <header
      className="topbar"
      style={{ position: "sticky", top: 0, zIndex: 50 }}
    >
      <div
        className="nav"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div className="brand" style={{ fontWeight: 800 }}>
          H-Town Zoo
        </div>

        {/* Desktop links */}
        <ul className="links hide-on-mobile">
          {isStaff ? <StaffLinks /> : <PublicLinks />}
        </ul>

        {/* Right: Cart + mobile menu */}
        <div
          className="nav-right"
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <CartWidget />
          </div>

          <div className="nav-anchor">
            <button
              ref={btnRef}
              className="mobile-menu-btn"
              aria-haspopup="true"
              aria-expanded={open}
              aria-label="Open menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="mobile-menu-icon" />
            </button>

            {open && (
              <div className="mobile-menu" role="menu">
                <ul>
                  {isStaff ? (
                    <StaffLinks onClick={() => setOpen(false)} />
                  ) : (
                    <PublicLinks onClick={() => setOpen(false)} />
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- Footer with Staff Login link ---------- */
function SiteFooter() {
  return (
    <footer>
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontWeight: 800 }}>H-Town Zoo</div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          © {new Date().getFullYear()} H-Town Zoo
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <NavLink to="/login">Customer Login</NavLink>
          <a
            className="staff-link"
            href="/staff/login"
            title="Employee portal"
          >
            Staff Login
          </a>
        </div>
      </div>
    </footer>
  );
}

/**
 * Role page wrapper: /employees/:role
 */
function ProtectedRolePage() {
  const { role } = useParams();
  return (
    <ProtectedRoute roles={["admin", role]}>
      <RolePage role={role} />
    </ProtectedRoute>
  );
}

/* ---------- App Routes ---------- */
export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      
      <Routes>
        {/* ---------- PUBLIC (customer) ---------- */}
        <Route path="/" element={<Home />} />
        <Route path="/about/mission" element={<Mission />} />
        <Route path="/about/conservation" element={<Conservation />} />
        <Route path="/about/contact" element={<Contact />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/visit" element={<Visit />} />
        <Route path="/visit/:id" element={<EventDetails />} />
        <Route path="/tickets" element={<CTickets />} />
        <Route path="/animals" element={<CAnimals />} />
        <Route path="/Exhibits" element={<ExhibitsPage />} />
        <Route path="/request" element={<RequestReceived />} />
        <Route path="scheduleEvents" element={<ZooScheduler />} />
        <Route path="/memberships" element={<Memberships />} />
        <Route
          path="/memberships/checkout/:tierId"
          element={<MembershipCheckout />}
        />
        <Route
          path="/memberships/confirmation"
          element={<MembershipConfirmation />}
        />

        {/* Checkout & order self-service (no staff login) */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<OrderLookup />} />
        <Route path="/orders/verify" element={<VerifyFromToken />} />
        <Route path="/order/:id" element={<OrderReceipt />} />
        <Route path="/food" element={<Food />} />
        <Route path="/gift-shop" element={<GiftShop />} />

        {/* Password/verify (public) */}
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset/:token" element={<Reset />} />
        <Route path="/verify/:token" element={<VerifyFromToken />} />
        <Route path="/verify-sent" element={<VerifySent />} />
        <Route path="/staff/forgot" element={<StaffForgot />} />
        <Route path="/staff/reset/:token" element={<StaffReset />} />

        {/* Auth pages (block if already logged in) */}
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <CustomerLogin />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthed>
              <CustomerRegister />
            </RedirectIfAuthed>
          }
        />
        <Route path="/account" element={<MyAccount />} />
        <Route path="/account/orders/:id" element={<AccountOrderDetail />} />
        <Route path="/account/pos/:id" element={<AccountPosReceipt />} />
        <Route path="/account/memberships/:id" element={<AccountMembershipDetail />} />
        <Route path="/account/donations/:id" element={<AccountDonationDetail />} />
        <Route
          path="/staff/login"
          element={
            <RedirectIfAuthed>
              <StaffLogin />
            </RedirectIfAuthed>
          }
        />

        {/* ---------- STAFF / PROTECTED ---------- */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={ANY_EMP}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/role"
          element={
            <ProtectedRoute roles={ANY_EMP}>
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
        <Route path="/employees/:role" element={<ProtectedRolePage />} />

        {/* Admin hub */}
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
        <Route
        path="/staff/animals"
        element={
          <ProtectedRoute roles={["admin", "ops_manager", "keeper", "vet"]}>
            <Animals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/animals/:id"
        element={
          <ProtectedRoute roles={["admin", "ops_manager", "keeper", "vet"]}>
            <AnimalView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/animals/:id/edit"
        element={
          <ProtectedRoute roles={["admin", "ops_manager", "keeper", "vet"]}>
            <AnimalEdit />
          </ProtectedRoute>
        }
      />

        {/* Feedings (keeper) */}
        <Route
          path="/feedings"
          element={
            <ProtectedRoute roles={["keeper", "admin", "ops_manager"]}>
              <Feedings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedings/:id"
          element={
            <ProtectedRoute roles={["keeper", "admin", "ops_manager"]}>
              <FeedingsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedings/:id/edit"
          element={
            <ProtectedRoute roles={["keeper", "admin", "ops_manager"]}>
              <FeedingsEdit />
            </ProtectedRoute>
          }
        />
        {/* VetVisit (vet)*/}
        <Route
          path="/vetvisit"
          element={
            <ProtectedRoute roles={["admin", "vet", "keeper"]}>
              <VetVisitsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vetvisit/:id"
          element={
            <ProtectedRoute roles={["admin", "vet", "keeper"]}>
              <VetVisitView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vetvisit/:id/edit"
          element={
            <ProtectedRoute roles={["admin", "vet"]}>
              <VetVisitEdit />
            </ProtectedRoute>
          }
        />
        {/* Reports */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/tickets"
          element={
            <ProtectedRoute roles={["admin", "op_manager", "gate_agent"]}>
              <TicketStats />
            </ProtectedRoute>
          }
        />

        {/* Events */}
        <Route
          path="/events"
          element={
            <ProtectedRoute roles={["admin", "ops_manager", "coordinator"]}>
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
            <ProtectedRoute roles={["admin", "ops_manager", "coordinator"]}>
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

        {/* Staff Orders moved to /staff/orders to avoid clashing with public /orders */}
        <Route
          path="/staff/orders"
          element={
            <ProtectedRoute roles={["admin", "ops_manager", "gate_agent"]}>
              <Orders />
            </ProtectedRoute>
          }
        />

        <Route path="/403" element={<Forbidden />} />
        <Route path="*" element={<Lost />} />
      </Routes>

      <SiteFooter />
    </BrowserRouter>
  );
}
