import React, {useEffect} from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate(); // <- just call useNavigate(), not destructure

  // Redirect based on role
  useEffect(() => {
    if (!user) return; // don't redirect if user info not loaded yet

    switch (user.role) {
      case "admin":
        break;
      case "keeper":
        navigate("/keeper", { replace: true });
        break;
      case "security":
        navigate("/security", { replace: true });
        break;
      case "vet":
        navigate("/vet", { replace: true });
        break;
      case "retail":
        navigate("/retail", { replace: true });
        break;
      case "gate_agent":
        navigate("/gate", { replace: true });
        break;
      default:
        navigate("/lost", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="page">
      <h1>Welcome {user?.first_name || ""}!</h1>
      <p>Role: <strong>{user?.role}</strong></p>
      <p>Email: <strong>{user?.email}</strong></p>

      <div className="grid">
        <div className="panel">
          <h3>Quick Actions</h3>
          {user.role === "admin" && (
            <ul>
              <li>
                <Link to="/employees/admin" className="">view employees</Link>
              </li>
              <li> 
                <Link to="/reports" className="">run reports</Link>
                </li>
              <li> 
                <Link to="/events" className="">manage events</Link>
              </li>
              <li> 
                <Link to="/animalStats" className="">search animals</Link>
              </li>
              <li>
                <Link to = "/reports/tickets">view ticket statistics</Link>
              </li>
            </ul>
          )}
        </div>
        <div className="panel">
          <h3>System Status</h3>
          <p>Everything looks good</p>
        </div>
      </div>
    </div>
  );
}
