// src/pages/Animals.jsx
import React from "react";

// Sample data if you don't have API yet
const animals = [
  {
    id: 1,
    name: "African Elephant",
    species: "Loxodonta africana",
    image: "https://example.com/elephant.jpg",
    description: "The African elephant is the largest land mammal on Earth.",
  },
  {
    id: 2,
    name: "Bengal Tiger",
    species: "Panthera tigris tigris",
    image: "https://example.com/tiger.jpg",
    description: "The Bengal tiger is a majestic predator native to India.",
  },
  {
    id: 3,
    name: "Giraffe",
    species: "Giraffa camelopardalis",
    image: "https://example.com/giraffe.jpg",
    description: "Giraffes are the tallest land animals, known for their long necks.",
  },
];

const Animals = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-green-800">
        Meet Our Animals
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {animals.map((animal) => (
          <div
            key={animal.id}
            className="bg-white rounded-2xl shadow-md overflow-hidden hover:scale-105 transition-transform duration-300"
          >
            <img
              src={animal.image}
              alt={animal.name}
              className="w-full h-64 object-cover"
            />
            <div className="p-4">
              <h2 className="text-2xl font-semibold mb-1">{animal.name}</h2>
              <p className="text-gray-500 italic mb-2">{animal.species}</p>
              <p className="text-gray-700">{animal.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Animals;
