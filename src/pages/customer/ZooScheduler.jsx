import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ZooScheduler() {
  const [events, setEvents] = useState([
    { id: 1, title: "Lion Feeding", date: "2025-10-25", time: "10:00 AM", desc: "Watch the lions get their breakfast!" },
    { id: 2, title: "Monkey Show", date: "2025-10-26", time: "2:00 PM", desc: "Fun tricks by our monkeys." },
  ]);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [desc, setDesc] = useState("");

  function addEvent(e) {
    // e.preventDefault();
    // if (!title || !date || !time) return;

    // const newEvent = {
    //   id: Date.now(),
    //   title,
    //   date,
    //   time,
    //   desc,
    // };

    // setEvents([...events, newEvent]);
    // setTitle("");
    // setDate("");
    // setTime("");
    // setDesc("");
  }

  // function deleteEvent(id) {
  //   setEvents(events.filter((ev) => ev.id !== id));
  // }

  return (
    <div className="page">
      <h1 style={{ marginBottom: "24px" }}>Zoo Events Scheduler</h1>

      {/* Add Event Form */}
      <form className="card" onSubmit={addEvent} style={{ marginBottom: "32px" }}>
        <h2>Add New Event</h2>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />

        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label>Time</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />

        <label>Description</label>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} />
        <Link to= "/request">
        <button className="btn" type="submit" style={{ marginTop: "16px" }}>Add Event</button>
        {/*calls to api if everything checks out*/}
        </Link>
      </form>

      {/* Event List */}
      <div className="grid">
        {events.map((ev) => (
          <div key={ev.id} className="card">
            <h3>{ev.title}</h3>
            <p><strong>Date:</strong> {ev.date}</p>
            <p><strong>Time:</strong> {ev.time}</p>
            {ev.desc && <p>{ev.desc}</p>}
            {/* <button
              className="btn"
              style={{ marginTop: "12px", background: "#e57373", borderColor: "#cc5555" }}
              onClick={() => deleteEvent(ev.id)}
            >
              Delete
            </button> */}
          </div>
        ))}
      </div>
    </div>
  );
}
