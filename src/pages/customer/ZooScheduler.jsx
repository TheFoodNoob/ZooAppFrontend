// src/pages/customer/ZooScheduler.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ZooScheduler() {
  const { token, user } = useAuth();
  const canEdit = !!user && (user.role === "admin" || user.role === "ops_manager");

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true); setErr("");
    try {
      const res = await fetch(`${api}/api/events?is_active=1&order=ASC&limit=200`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function addEvent(e) {
    e.preventDefault();
    if (!canEdit) return;
    if (!title || !date || !time) return;

    setSubmitting(true);
    try {
      const body = {
        title,
        description: desc,
        location: "",
        // backend expects date+time; adjust if your schema differs:
        start_time: `${date}T${time}`,
        end_time: `${date}T${time}`,
        is_active: 1,
      };
      const res = await fetch(`${api}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Create failed (${res.status})`);
      setTitle(""); setDate(""); setTime(""); setDesc("");
      await load();
    } catch (e) {
      alert(e.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteEvent(id) {
    if (!canEdit) return;
    if (!confirm("Delete this event?")) return;
    try {
      const res = await fetch(`${api}/api/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      await load();
    } catch (e) {
      alert(e.message || "Failed to delete");
    }
  }

  return (
    <div className="page">
      <h1>Zoo Events Scheduler</h1>

      {canEdit && (
        <form className="card" onSubmit={addEvent} style={{ marginBottom: 24 }}>
          <h2>Add New Event</h2>
          <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label>Time<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
          <label>Description<input value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Add Event"}
          </button>
        </form>
      )}

      <div className="panel">
        {loading && <div>Loading…</div>}
        {err && <div className="error">{err}</div>}
        {!loading && !err && events.length === 0 && <div>No scheduled events.</div>}

        <div className="grid">
          {events.map((ev) => (
            <div key={ev.event_id} className="card">
              <h3>{ev.title || "Untitled Event"}</h3>
              {ev.start_time && <p><strong>Starts:</strong> {new Date(ev.start_time).toLocaleString()}</p>}
              {ev.end_time && <p><strong>Ends:</strong> {new Date(ev.end_time).toLocaleString()}</p>}
              {ev.description && <p>{ev.description}</p>}
              {canEdit && (
                <button className="btn" style={{ background: "#e57373", borderColor: "#cc5555" }} onClick={() => deleteEvent(ev.event_id)}>
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>

        {!canEdit && (
          <div className="note" style={{ marginTop: 12 }}>
            Viewing mode. Log in as admin/ops to add or delete events.
          </div>
        )}
      </div>
    </div>
  );
}
