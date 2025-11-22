"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ShieldAlert, Users, Server, DollarSign, Activity, ArrowLeft } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";

export default function DevDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("saas_token");
    if (!token) { router.push("/"); return; }

    axios.get(`${BASE_URL}/v1/admin/global-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
        setData(res.data);
        setLoading(false);
    })
    .catch(err => {
        console.error(err);
        setError("Acesso Negado. Você não é um Deus.");
        setLoading(false);

    });
  }, [router]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Carregando Matrix...</div>;

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-500 gap-4">
        <ShieldAlert size={64} />
        <h1 className="text-2xl font-bold">{error}</h1>
        <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:underline">Voltar para o mundo mortal</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-slate-200 p-8 font-mono">
      
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-green-500 flex items-center gap-2">
            <Server /> GOD MODE_
        </h1>
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-xs text-slate-500 hover:text-white">
            <ArrowLeft size={14}/> Sair
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 p-4 rounded border border-slate-800">
            <span className="text-xs text-slate-500 uppercase">Total Empresas</span>
            <div className="text-3xl font-bold text-white mt-1">{data.global.totalTenants}</div>
        </div>
        <div className="bg-slate-900 p-4 rounded border border-slate-800">
            <span className="text-xs text-slate-500 uppercase">Total Leads (Banco)</span>
            <div className="text-3xl font-bold text-blue-400 mt-1">{data.global.totalContacts}</div>
        </div>
        <div className="bg-slate-900 p-4 rounded border border-slate-800">
            <span className="text-xs text-slate-500 uppercase">Msgs Processadas</span>
            <div className="text-3xl font-bold text-purple-400 mt-1">{data.global.totalMessages}</div>
        </div>
        <div className="bg-slate-900 p-4 rounded border border-green-900/30 border-l-4 border-l-green-500">
            <span className="text-xs text-slate-500 uppercase">MRR Estimado</span>
            <div className="text-3xl font-bold text-green-400 mt-1">R$ {data.global.revenueEstimate}</div>
        </div>
      </div>

      <div className="bg-slate-900 rounded border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-500 font-medium border-b border-slate-800">
                <tr>
                    <th className="p-4">Empresa</th>
                    <th className="p-4">Plano</th>
                    <th className="p-4">Conexão</th>
                    <th className="p-4">Webhook</th>
                    <th className="p-4 text-right">Leads Total</th>
                    <th className="p-4 text-right">Média/Dia</th>
                    <th className="p-4 text-right">Msgs</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
                {data.tenants.map((tenant: any) => (
                    <tr key={tenant.id} className="hover:bg-slate-800/50 transition">
                        <td className="p-4 font-bold text-white">
                            {tenant.name}
                            <div className="text-[10px] text-slate-600 font-normal">{tenant.id}</div>
                        </td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                tenant.plan === 'PRO' ? 'bg-red-900/50 text-red-400' : 
                                tenant.plan === 'STARTER' ? 'bg-blue-900/50 text-blue-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                                {tenant.plan}
                            </span>
                        </td>
                        <td className="p-4">
                            {tenant.hasConnection ? <span className="text-green-500">● Online</span> : <span className="text-red-500">○ Offline</span>}
                        </td>
                        <td className="p-4 text-xs font-mono text-slate-400">
                            {tenant.webhook}
                        </td>
                        <td className="p-4 text-right text-white">{tenant.leads}</td>
                        <td className="p-4 text-right text-green-400 font-bold">{tenant.avgLeadsPerDay}</td>
                        <td className="p-4 text-right text-slate-400">{tenant.msgs}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

    </div>
  );
}