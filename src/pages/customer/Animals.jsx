// src/pages/customer/Animals.jsx
import React from "react";

const FEATURED_ANIMALS = [
  {
    name: "Sandy",
    species: "Harbor Seal",
    image: "/img/harborSeal.webp",
    description:
      "Sandy is very friendly and loves to play in the water and chase fish during feeding time.",
  },
  {
    name: "Granger",
    species: "White Saber Tooth Tiger",
    image: "/img/tiger.jpg",
    description:
      "Granger wouldn’t let a fly touch his food. He’s very territorial but secretly loves attention from keepers.",
  },
  {
    name: "Rio",
    species: "Scarlet Macaw",
    image: "/img/animals/bird-macaw.webp",
    description:
      "Rio is a brightly colored macaw who mimics sounds from guests and loves shredding new toys.",
  },
  {
    name: "Willow",
    species: "Reticulated Giraffe",
    image: "/img/animals/herbivore-giraffe.jpg",
    description:
      "Willow uses her long tongue to strip leaves off branches and is often seen towering over the savanna yard.",
  },
];

export default function CAnimals() {
  return (
    <div className="page">
      <div className="container">
        <h1>Meet Our Animals</h1>
        <p className="page-intro" style={{ maxWidth: 640 }}>
          Get to know a few of the animals that call H-Town Zoo home. This is a
          small sample — staff can see the full directory in the employee tools.
        </p>

        <div
          className="cards-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            marginTop: 20,
          }}
        >
          {FEATURED_ANIMALS.map((a) => (
            <article key={a.name} className="card" style={{ padding: 16 }}>
              <div
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                  marginBottom: 12,
                }}
              >
                <img
                  src={a.image}
                  alt={a.name}
                  style={{
                    width: "100%",
                    height: 190,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              <h2 style={{ fontSize: 18, marginBottom: 4 }}>{a.name}</h2>
              <p
                style={{
                  fontStyle: "italic",
                  fontSize: 14,
                  color: "var(--muted)",
                  marginBottom: 8,
                }}
              >
                {a.species}
              </p>
              <p style={{ fontSize: 14 }}>{a.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
