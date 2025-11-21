"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight, Building2 } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${BASE_URL}/v1/auth/register`, formData);


      localStorage.setItem("saas_token", res.data.access_token);

      router.push("/dashboard");
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800">
             <img src="/logo.png" alt="BullAPI" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">Crie sua conta</h1>
          <p className="text-slate-400 text-sm mt-2">Comece gratuitamente hoje mesmo.</p>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Empresa</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Building2 size={18} />
              </div>
              <input
                type="text"
                required
                placeholder="Ex: Minha Agência"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <>Criar Conta <ArrowRight size={20} /></>}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Já tem uma conta? <a href="/" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Fazer Login</a>
        </p>
      </div>
    </div>
  );
}