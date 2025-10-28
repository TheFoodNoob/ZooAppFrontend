import React from "react";
import { Link } from "react-router-dom";

export default function RequestReceived() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">
        Your request has been received
      </h1>
      <p className="text-gray-600 mb-6">
        We’ll get back to you as soon as possible.
      </p>
      <Link
        to="/"
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Back to Home
      </Link>
    </div>
  );
}
