import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";
export default function Dashboard() {
  const { user } = useAuth();
  const {navigate} = useNavigate();

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
            </ul>
          )}
          {user.role === "keeper" && (
            <ul>
              <li><Link to="/keeper">my tasks</Link></li>
              <li><Link to="/animalStats">animal directory</Link></li>
              <li><Link to = "/feedings">view feeding logs</Link></li>
            </ul>
          )}
          {user.role === "security" && (
            <ul>
              <li><Link to="/security">my tasks</Link></li>
              <li><Link to="/employees/security">view personel</Link></li>
              
              <li><Link to = "/..">view security logs</Link></li>
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
