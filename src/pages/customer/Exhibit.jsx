import { div } from "framer-motion/client";
import React from "react";

export default function ExhibitsPage() {
  const exhibits = [
    {
      id: 1,
      name: "Grasslands Exhibit",
      description:
        "Experience the vast savannas where our tiger roams freely. Learn how these animals adapt to life on the open plains.",
      animals: ["Saber Tooth Tiger"],
      image:
        "",
    },
    {
      id: 2,
      name: "Seal Exhibit",
      description:
        "Meet our playful seals as they swim, dive, and splash! Discover their unique adaptations to marine life.",
      animals: ["Harbor Seal"],
      image:
        "",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">
        Zoo Exhibits
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {exhibits.map((exhibit) => (
          
          <div
            key={exhibit.id}
            className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200"
          >
            <div className="panel">
            <img
              src={exhibit.image}
              alt={exhibit.name}
              className="w-full h-60 object-cover"
            />
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-green-700 mb-2">
                {exhibit.name}
              </h2>
              <p className="text-gray-600 mb-4">{exhibit.description}</p>
              <h3 className="font-medium text-gray-800 mb-1">Animals:</h3>
              <ul className="list-disc list-inside text-gray-700">
                {exhibit.animals.map((animal) => (
                  <li key={animal}>{animal}</li>
                ))}
              </ul>
            </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
