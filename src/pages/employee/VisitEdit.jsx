import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api";
import fetchAuth from "../../utils/fetchAuth";
import { useAuth } from "../../context/AuthContext";

export default function VetVisitEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [form, setForm] = useState({
    id: "",
    animal_id: "",
    vet_user_id: "",
    reason: "",
    diagnosis: "",
    visit_date: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch current visit
  useEffect(() => {
    const fetchVisit = async () => {
      try {
        const res = await fetchAuth(`${api}/api/vetvisit/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed");

        const v = await res.json();

        // Convert date to YYYY-MM-DD for input fields
        const formattedDate = v.visit_date
          ? new Date(v.visit_date).toISOString().slice(0, 16)
          : "";

        setForm({
          id: v.id,
          animal_id: v.animal_id,
          vet_user_id: v.vet_user_id,
          reason: v.reason,
          diagnosis: v.diagnosis,
          visit_date: formattedDate,
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load vet visit.");
      } finally {
        setLoading(false);
      }
    };

    fetchVisit();
  }, [id, token]);

  // Handle form change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetchAuth(`${api}/api/vetvisit/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Update failed");

      navigate(`/vetvisits/${id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to update vet visit.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-4">Edit Vet Visit</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ID (readonly) */}
        <div>
          <label className="block font-semibold">Visit ID (readonly)</label>
          <input
            type="text"
            value={form.id}
            readOnly
            className="border p-2 w-full bg-gray-100"
          />
        </div>

        {/* Animal ID */}
        <div>
          <label className="block font-semibold">Animal ID</label>
          <input
            type="number"
            name="animal_id"
            value={form.animal_id}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        {/* Vet User ID */}
        <div>
          <label className="block font-semibold">Vet User ID</label>
          <input
            type="number"
            name="vet_user_id"
            value={form.vet_user_id}
            onChange={handleChange}
            className="border p-2 w-full"
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

        <button
          type="submit"
          className="btn btn-primary w-full mt-4"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
