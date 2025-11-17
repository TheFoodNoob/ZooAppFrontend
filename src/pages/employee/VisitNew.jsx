// src/pages/employee/VisitNew.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import fetchAuth from "../../utils/fetchAuth";
import { useAuth } from "../../context/AuthContext";

export default function VisitNew() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  // try to grab the vet's employee id from the logged-in user
  const defaultVetId = user?.employee_id ?? user?.id ?? "";

  const [form, setForm] = useState({
    animal_id: "",
    vet_user_id: defaultVetId,
    visit_date: "",
    reason: "",
    diagnosis: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        animal_id: Number(form.animal_id),
        vet_user_id: Number(
          form.vet_user_id || defaultVetId || 0
        ), // must be a valid employee_id
        visit_date: form.visit_date,
        reason: form.reason,
        diagnosis: form.diagnosis || null,
      };

      const res = await fetchAuth(`${api}/api/vetvisit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Create error:", data);
        throw new Error(data.error || "Create failed");
      }

      const data = await res.json(); // { vet_visit_id: ... }
      const newId = data.vet_visit_id;
      navigate(`/vetvisit/${newId}`);
    } catch (err) {
      console.error(err);
      setError("Failed to create vet visit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-4">New Vet Visit</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Animal ID */}
        <div>
          <label className="block font-semibold">Animal ID</label>
          <input
            type="number"
            name="animal_id"
            value={form.animal_id}
            onChange={handleChange}
            className="border p-2 w-full"
            required
          />
        </div>

        {/* Vet User ID (auto–filled but editable just in case) */}
        <div>
          <label className="block font-semibold">Vet User ID</label>
          <input
            type="number"
            name="vet_user_id"
            value={form.vet_user_id}
            onChange={handleChange}
            className="border p-2 w-full"
            placeholder={
              defaultVetId ? `default: ${defaultVetId}` : "Enter vet employee ID"
            }
            required
          />
        </div>

        {/* Visit Date */}
        <div>
          <label className="block font-semibold">Visit Date</label>
          <input
            type="datetime-local"
            name="visit_date"
            value={form.visit_date}
            onChange={handleChange}
            className="border p-2 w-full"
            required
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block font-semibold">Reason</label>
          <input
            type="text"
            name="reason"
            value={form.reason}
            onChange={handleChange}
            className="border p-2 w-full"
            required
          />
        </div>

        {/* Diagnosis */}
        <div>
          <label className="block font-semibold">Diagnosis</label>
          <input
            type="text"
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm mt-2">{error}</div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create Visit"}
          </button>
          <button
            type="button"
            className="btn flex-1"
            onClick={() => navigate("/vetvisit")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
