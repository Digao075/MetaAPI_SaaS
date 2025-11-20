"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Save, Settings, ArrowLeft, Plus, Trash2, Smartphone } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [tenantId, setTenantId] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  

  const [connections, setConnections] = useState<any[]>([]);


  const [newConn, setNewConn] = useState({ name: "", phoneId: "", token: "" });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("saas_token");
    if (!savedToken) { router.push("/"); return; }
    try {
      const decoded: any = jwtDecode(savedToken);
      setToken(savedToken);
      setTenantId(decoded.tenantId);
      fetchSettings(decoded.tenantId, savedToken);
    } catch (error) { router.push("/"); }
  }, []);

  const fetchSettings = async (tId: string, tkn: string) => {
    try {
      const res = await axios.get(`${BASE_URL}/v1/meta/webhook/settings/${tId}`, {
        headers: { Authorization: `Bearer ${tkn}` }
      });
      setCompanyName(res.data.name);
      setWebhookUrl(res.data.webhookUrl || "");
      setConnections(res.data.connections || []);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/v1/meta/webhook/settings/${tenantId}`, {
        name: companyName,
        webhookUrl: webhookUrl,
        phoneId: "", 
        token: ""    
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("Dados da empresa salvos!");
    } catch (error) { alert("Erro ao salvar."); }
  };

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/v1/meta/webhook/settings/${tenantId}/connections`, newConn, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewConn({ name: "", phoneId: "", token: "" });
      setShowAddForm(false);
      fetchSettings(tenantId, token); 
      alert("Conexão adicionada!");
    } catch (error) { alert("Erro ao adicionar conexão."); }
  };

  const handleDeleteConnection = async (connId: string) => {
    if(!confirm("Tem certeza? Isso vai parar o bot para este número.")) return;
    try {
      await axios.post(`${BASE_URL}/v1/meta/webhook/settings/${tenantId}/connections/${connId}/delete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSettings(tenantId, token);
    } catch (error) { alert("Erro ao deletar."); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex justify-center font-sans">
      <div className="w-full max-w-3xl space-y-8">
      
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-900 rounded-full transition text-slate-400 hover:text-white">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Settings className="text-red-500" /> Configurações
            </h1>
            <p className="text-slate-500">Gerencie múltiplos números e integrações</p>
          </div>
        </div>

        <form onSubmit={handleSaveCompany} className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">Dados da Empresa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Negócio</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-white focus:border-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Webhook (n8n)</label>
              <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-white focus:border-red-500 outline-none font-mono text-sm" />
            </div>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition flex items-center gap-2 text-sm font-bold">
            <Save size={16} /> Salvar Dados
          </button>
        </form>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
             <h2 className="text-lg font-bold text-white">Conexões WhatsApp</h2>
             <button onClick={() => setShowAddForm(!showAddForm)} className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-500 transition flex items-center gap-2 text-xs font-bold">
               <Plus size={16} /> Nova Conexão
             </button>
          </div>
          {showAddForm && (
            <form onSubmit={handleAddConnection} className="bg-slate-950 p-4 rounded-lg border border-green-900/30 space-y-3 animate-fade-in">
               <h3 className="text-green-400 text-sm font-bold">Adicionar Novo Número</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input placeholder="Nome (ex: Vendas)" required value={newConn.name} onChange={e => setNewConn({...newConn, name: e.target.value})} className="p-2 bg-slate-900 border border-slate-800 rounded text-white text-sm" />
                  <input placeholder="Phone ID (Meta)" required value={newConn.phoneId} onChange={e => setNewConn({...newConn, phoneId: e.target.value})} className="p-2 bg-slate-900 border border-slate-800 rounded text-white text-sm" />
                  <input type="password" placeholder="Access Token" required value={newConn.token} onChange={e => setNewConn({...newConn, token: e.target.value})} className="p-2 bg-slate-900 border border-slate-800 rounded text-white text-sm" />
               </div>
               <div className="flex justify-end gap-2">
                 <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-500 text-xs hover:text-white">Cancelar</button>
                 <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">Conectar</button>
               </div>
            </form>
          )}
          <div className="space-y-3">
            {connections.length === 0 ? (
              <p className="text-slate-600 text-sm italic">Nenhuma conexão ativa.</p>
            ) : (
              connections.map((conn) => (
                <div key={conn.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-green-500 border border-slate-800">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{conn.name}</h3>
                        <p className="text-xs text-slate-500 font-mono">ID: {conn.phoneId}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-900/50">Ativo</span>
                      <button onClick={() => handleDeleteConnection(conn.id)} className="text-slate-600 hover:text-red-500 transition">
                        <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}