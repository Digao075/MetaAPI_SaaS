"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";

export default function LoginPage() {
  const router = useRouter();
  

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [view, setView] = useState<"login" | "forgot">("login"); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {

      const res = await axios.post(`${BASE_URL}/v1/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("saas_token", res.data.access_token);
      router.push("/dashboard");
      
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Credenciais inválidas.");
      } else {
        setError("Erro de conexão. Verifique se o backend está rodando.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await axios.post(`${BASE_URL}/v1/auth/forgot-password`, {
        email,
      });
      setSuccessMessage("Se o e-mail estiver cadastrado, você receberá um link em instantes.");
    } catch (err) {
      setError("Erro ao solicitar recuperação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md relative z-10 backdrop-blur-sm transition-all duration-500">

        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 relative flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800 shadow-lg shadow-red-900/10 p-3">
             <img src="/logo.png" alt="BullAPI" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Bull<span className="text-red-500">API</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {view === "login" ? "Acesse seu painel operacional." : "Recupere seu acesso."}
          </p>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-6 text-center animate-pulse">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-950/50 border border-green-900/50 text-green-400 px-4 py-3 rounded-lg text-sm mb-6 text-center flex flex-col items-center gap-2">
            <CheckCircle size={24} />
            {successMessage}
          </div>
        )}

        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Corporativo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">Senha</label>
                  <button 
                    type="button" 
                    onClick={() => setView("forgot")} 
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Esqueceu?
                  </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-3 rounded-lg hover:from-red-500 hover:to-red-400 transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Entrando...</> : <><ArrowRight size={20} /> Acessar Plataforma</>}
            </button>
          </form>
        )}
        {view === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirme seu Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!successMessage}
              className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition-all border border-slate-700 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Enviando...</> : "Enviar Link de Recuperação"}
            </button>

            <button
              type="button"
              onClick={() => { setView("login"); setSuccessMessage(""); setError(""); }}
              className="w-full text-slate-500 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft size={16} /> Voltar para Login
            </button>
          </form>
        )}

      </div>
    </div>
  );
}