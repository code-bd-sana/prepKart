'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as React from 'react'; 
import { toast } from "react-toastify";

export default function AdminRegisterPage({ params }) { 
  const router = useRouter();
  
  const { locale } = React.use(params); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/admin-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, adminKey })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Admin account created! Now login.");
        router.push(`/${locale}/login`); 
      } else {
        toast.error(data.error || "Failed to create admin");
        setError(data.error || "Failed to create admin");
      }
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Admin</h1>
        <p className="text-gray-600 mb-6">Enter secret key to create admin account</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Your email"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Password (6+ characters)"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Admin Secret Key"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Admin Account"}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-500">
          Already admin? <a href={`/${locale}/login`} className="text-green-600 font-medium">Login here</a>
        </p>
      </div>
    </div>
  );
}