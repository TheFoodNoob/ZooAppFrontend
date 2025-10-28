// src/pages/Animals.jsx
import React from "react";
import sealImg from "../../img/seal.jpg"
import tigerImg from "../../img/tiger.webp"

//TODO::Need To pull these via API
const seal = {
  name: "Sally",
  species: "Harbor Seal",
  image: sealImg, 
  description: "Sally is very friendly. She loves to play and eat fish!",
};
const tiger = {
  name: "Granger",
  species: "White Saber Tooth Tiger",
  image: tigerImg,
  description: "Granger wouldnt let a fly touch his food. He's very territorial but I hear he loves to tell secrets.",
};

const Animals = () => {
  return (
    <div className="min-h-screen bg-blue-50 p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-center mb-8 text-blue-900">
        Meet Our Animals
      </h1>
      <div className="panel">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-sm hover:scale-105 transition-transform duration-300">
        <img
          src={seal.image}
          alt={seal.name}
          className="w-full h-64 object-cover"
        />
        <div className="p-6 text-center">
      </div>
          <h2 className="text-2xl font-semibold mb-2">{seal.name}</h2>
          <p className="text-gray-500 italic mb-3">{seal.species}</p>
          <p className="text-gray-700">{seal.description}</p>
        </div>
      </div>
      <div className="panel">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-sm hover:scale-105 transition-transform duration-300">
        <img
          src={tiger.image}
          alt={tiger.name}
          className="w-full h-64 object-cover"
        />
        <div className="p-6 text-center">
      </div>
          <h2 className="text-2xl font-semibold mb-2">{tiger.name}</h2>
          <p className="text-gray-500 italic mb-3">{tiger.species}</p>
          <p className="text-gray-700">{tiger.description}</p>
        </div>
      </div>
    </div>
  );
};

export default Animals;