"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("teste@teste.com");
  const [password, setPassword] = useState("123");
  const [error, setError] = useState("");

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";

const API_URL = `${BASE_URL}`; 
const SOCKET_URL = `${BASE_URL}`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email,
        password,
      });
      const { access_token } = response.data;
      localStorage.setItem("saas_token", access_token);
      router.push("/chat");
      
    } catch (err) {
      console.error(err);
      setError("Email ou senha inválidos. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Login do SaaS</h1>
          <p className="text-gray-500">Entre para gerenciar seus atendimentos</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="******"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200 font-medium"
          >
            Entrar na Plataforma
          </button>
        </form>
      </div>
    </div>
  );
}