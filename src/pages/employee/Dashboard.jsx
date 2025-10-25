import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Link } from "react-router-dom";
export default function Dashboard() {
  const { user } = useAuth();
  const today = new Date();
  const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  return (
    <div className="page">
      <h2>Welcome {user?.first_name || ""}!</h2>
      <h1>Today is {formattedDate || ""}</h1>
      <p>Role: <strong>{user?.role}</strong></p>
      <p>Email: <strong>{user?.email}</strong></p>

      <div className="grid">
        <div className="panel">
          <h3>Quick Actions</h3>
          <ul>
            <li>
              <Link to="/employees" className="">view employees</Link>
            </li>
            <li> 
              <Link to="/reports" className="">run reports</Link>
              </li>
            <li> 
              <Link to="/events" className="">manage events</Link>
            </li>
          </ul>
        </div>
        <div className="panel">
          <h3>Important Events</h3>
          <p>Nothing to do...(better get busy!)</p>
        </div>
        <div className="panel">
          <h4>Sales</h4>
          <p>Traffic Rates, conversion rate, and sales fiugres</p>
        </div>
        <div className="panel">
          <h3>Server Status</h3>
          <p>Everything is working fine </p>
          {/*i was trolling*/}
          <svg width="50" height="50" viewBox="0 0 64 64">
          {/* Face */}
          <circle cx="32" cy="32" r="30" fill="#90ee90" />
          {/* Eyes */}
          <circle cx="22" cy="24" r="4" fill="white" />
          <circle cx="42" cy="24" r="4" fill="white" />
          {/* Smile */}
          <path
            d="M22 40 Q32 50 42 40"
            stroke="white"
            strokeWidth="4"
            fill="transparent"
            strokeLinecap="round"
          />
        </svg>
        </div>
        <div className="panel">
          <Link to = "/departments">Departments</Link>
        </div>
      </div>
    </div>
  );
}
