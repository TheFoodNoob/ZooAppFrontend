// src/components/Toast.jsx
import React, { useEffect } from "react";

export default function Toast({ open, type = "info", text = "", onClose }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), 2500);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`toast ${type}`}>
      <span>{text}</span>
      <button className="toast-close" onClick={onClose} aria-label="Close">×</button>
    </div>
  );
}
