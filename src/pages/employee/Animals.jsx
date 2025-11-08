import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";

//TODO:: Need to be able to edit/add/delete animals similar to how employee currently is

export default function Animals() {
  const [list, setList] = useState([]);         // all animals from API
  const [filtered, setFiltered] = useState([]); // filtered list to display
  const [search, setSearch] = useState("");     // search query
  const [msg, setMsg] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    load();
  }, []);

  // Fetch animal data from backend
  const load = async () => {
    try {
      const res = await fetch(`${api}/api/animals`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load animals");

      const data = await res.json();
      setList(data);
      setFiltered(data); // initialize filtered list
    } catch (err) {
      setMsg(err.message || "Error loading animals");
    }
  };

  // Search filtering logic
  useEffect(() => {
    const q = search.toLowerCase();
    const results = list.filter(
      (a) =>
        a.animal_name.toLowerCase().includes(q) ||
        a.species.toLowerCase().includes(q) ||
        a.exhibit.toLowerCase().includes(q) ||
        a.animal_status.toLowerCase().includes(q)
    );
    setFiltered(results);
  }, [search, list]);

  return (
    <div className="page">
      <h2>Animal Directory</h2>
      {msg && <p>{msg}</p>}

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by name, species, or exhibit..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-bar"
      />

      {/* Table of Animals */}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Species</th>
            <th>Exhibit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length > 0 ? (
            filtered.map((a) => (
              <tr key={a.animal_id}>
                <td>{a.animal_name}</td>
                <td>{a.species}</td>
                <td>{a.exhibit}</td>
                <td>{a.animal_status}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No animals found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
