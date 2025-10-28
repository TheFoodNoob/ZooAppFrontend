// src/pages/employee/RoleHub.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const map = {
  admin: "/dash/admin",
  ops_manager: "/dash/ops",
  keeper: "/dash/keeper",
  vet: "/dash/vet",
  gate_agent: "/dash/gate",
  retail: "/dash/retail",
  coordinator: "/dash/coordinator",
  security: "/dash/security",
};

export default function RoleHub() {
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    const to = user?.role ? map[user.role] : "/dashboard";
    nav(to || "/dashboard", { replace: true });
  }, [user, nav]);

  return <div className="page">Redirecting…</div>;
}
