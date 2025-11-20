
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { 
  Users, MessageCircle, BarChart3, 
  MessageSquare, ArrowUpRight, ArrowDownLeft, Activity, ShieldAlert, Settings, CreditCard
} from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";

interface DashboardStats {
  totalContacts: number;
  messagesToday: number;
  contactsByStatus: { status: string; count: number }[];
  messagesAnalysis: { incoming: number; outgoing: number };
}

interface TokenPayload {
  tenantId: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("saas_token");
    if (!token) { router.push("/"); return; }
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      fetchStats(decoded.tenantId, token);
    } catch (error) { router.push("/"); }
  }, []);

  const fetchStats = async (tenantId: string, token: string) => {
    try {
      const res = await axios.get(`${BASE_URL}/v1/meta/webhook/dashboard/${tenantId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (error) {
      console.error("Erro", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">Carregando o Sistema...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      

      <div className="flex justify-between items-end mb-10 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">

          <div className="w-14 h-14 relative"> 
             <img src="/logo.png" alt="BullAPI Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Bull<span className="text-red-500">API</span></h1>
            <p className="text-slate-500 text-sm mt-1">Painel de Controle Operacional</p>
          </div>
        </div>

        <div className="flex gap-3">

          <button 
            onClick={() => router.push("/billing")}
            className="bg-slate-900 text-slate-400 p-2.5 rounded-md border border-slate-700 hover:border-green-500 hover:text-green-400 transition-all"
            title="Detalhes da Assinatura"
          >
            <CreditCard size={20} />
          </button>


          <button 
            onClick={() => router.push("/settings")}
            className="bg-slate-900 text-slate-400 p-2.5 rounded-md border border-slate-700 hover:border-slate-500 hover:text-white transition-all"
            title="Configurações"
          >
            <Settings size={20} />
          </button>

          <button 
            onClick={() => router.push("/kanban")}
            className="bg-slate-900 text-slate-300 px-5 py-2.5 rounded-md border border-slate-700 hover:border-slate-500 hover:text-white transition-all flex items-center gap-2 text-sm font-medium"
          >
            <BarChart3 size={18} /> Pipeline
          </button>
          <button 
            onClick={() => router.push("/chat")}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2.5 rounded-md shadow-lg shadow-red-900/30 hover:from-red-500 hover:to-red-600 transition-all flex items-center gap-2 text-sm font-medium"
          >
            <MessageCircle size={18} /> Acessar Chat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300">Total de Leads</p>
              <h3 className="text-4xl font-bold text-white mt-2">{stats?.totalContacts}</h3>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg text-blue-400 border border-slate-700">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <span className="text-green-400 flex items-center gap-1 bg-green-400/10 px-2 py-0.5 rounded">
               <ArrowUpRight size={12} /> +12%
            </span>
            <span>esse mês</span>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300">Mensagens (24h)</p>
              <h3 className="text-4xl font-bold text-white mt-2">{stats?.messagesToday}</h3>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg text-red-500 border border-slate-700">
              <Activity size={24} />
            </div>
          </div>
           <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
             <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-[70%]"></div>
             </div>
             <span>Alto Volume</span>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all group">
           <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300">Fluxo de Conversa</p>
              <MessageSquare size={20} className="text-slate-600" />
           </div>
           <div className="flex gap-6 items-end">
              <div>
                <span className="text-2xl font-bold text-white block">{stats?.messagesAnalysis.incoming}</span>
                <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                   <ArrowDownLeft size={12} className="text-green-500"/> Recebidas
                </span>
              </div>
              <div className="h-10 w-px bg-slate-800"></div>
              <div>
                <span className="text-2xl font-bold text-white block">{stats?.messagesAnalysis.outgoing}</span>
                <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                   <ArrowUpRight size={12} className="text-blue-500"/> Enviadas
                </span>
              </div>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
         <ShieldAlert size={18} className="text-slate-400"/>
         <h2 className="text-lg font-bold text-white">Status do Funil</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats?.contactsByStatus.map((statusItem) => {
           const isClosed = statusItem.status === 'CLOSED';
           return (
            <div key={statusItem.status} className={`p-4 rounded-lg border flex justify-between items-center ${
                isClosed 
                ? 'bg-green-950/30 border-green-900/50' 
                : 'bg-slate-900 border-slate-800'
            }`}>
              <span className={`font-medium text-sm ${isClosed ? 'text-green-400' : 'text-slate-400'}`}>
                {statusItem.status === 'OPEN' ? 'Novos Leads' : 
                 statusItem.status === 'PENDING' ? 'Em Negociação' : 
                 statusItem.status === 'CLOSED' ? 'Fechados' : statusItem.status}
              </span>
              <span className={`py-1 px-3 rounded-full text-sm font-bold ${
                  isClosed ? 'bg-green-500 text-black' : 'bg-slate-800 text-white'
              }`}>
                {statusItem.count}
              </span>
            </div>
           )
        })}
      </div>

    </div>
  );
}