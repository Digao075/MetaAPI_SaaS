// Arquivo: frontend/src/app/chat/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { MessageSquare, Send, User, Phone, LogOut, ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";
const API_URL = `${BASE_URL}/v1/meta/webhook`;
const SOCKET_URL = BASE_URL;

interface TokenPayload {
  userId: string;
  email: string;
  tenantId: string;
}

export default function ChatPage() {
  const router = useRouter();
  
  const [myUserId, setMyUserId] = useState("");
  const [myTenantId, setMyTenantId] = useState("");
  const [token, setToken] = useState("");

  const [contacts, setContacts] = useState<any[]>([]);
  const [activeContact, setActiveContact] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("saas_token");
    if (!savedToken) { router.push("/"); return; }
    try {
      const decoded = jwtDecode<TokenPayload>(savedToken);
      setToken(savedToken);
      setMyUserId(decoded.userId);
      setMyTenantId(decoded.tenantId);
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    } catch (error) { router.push("/"); }
  }, [router]);

  useEffect(() => {
    if (!myTenantId || !token) return;
    fetchContacts();
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    
    socket.on("nova-mensagem", (novaMsg) => {
      if (activeContact && novaMsg.contactId === activeContact.id) {
        setMessages((prev) => [...prev, novaMsg]);
        scrollToBottom();
      }
      fetchContacts();
    });
    return () => { socket.disconnect(); };
  }, [myTenantId, token, activeContact]);

  useEffect(() => {
    if (activeContact && myTenantId) {
      fetchMessages(activeContact.id);
    }
  }, [activeContact, myTenantId]);

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  };

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${API_URL}/chat/${myTenantId}/contacts`);
      setContacts(res.data);
    } catch (error) { console.error(error); }
  };

  const fetchMessages = async (contactId: string) => {
    try {
      const res = await axios.get(`${API_URL}/chat/${myTenantId}/messages/${contactId}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (error) { console.error(error); }
  };

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContact) return;
    const textToSend = inputText;
    setInputText("");
    try {
      await axios.post(`${API_URL}/send-text`, {
        tenantId: myTenantId,
        userId: myUserId,
        contactWaId: activeContact.whatsapp_number,
        text: textToSend,
      });
    } catch (error) { console.error(error); }
  };

  const handleLogout = () => {
    localStorage.removeItem("saas_token");
    router.push("/");
  };

  if (!myTenantId) return <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">Carregando Chat...</div>;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      
      {/* BARRA LATERAL */}
      <div className="w-1/3 max-w-sm bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Header Sidebar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <button onClick={() => router.push("/dashboard")} className="text-slate-400 hover:text-white">
                <ArrowLeft size={20} />
             </button>
             <div>
                <h1 className="font-bold text-lg text-white">Conversas</h1>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                   <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                   {isConnected ? 'Online' : 'Conectando...'}
                </p>
             </div>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-400 transition">
             <LogOut size={18} />
          </button>
        </div>

        {/* Search Bar (Visual) */}
        <div className="p-3 border-b border-slate-800">
           <div className="bg-slate-950 flex items-center gap-2 px-3 py-2 rounded-md border border-slate-800 text-sm">
              <Search size={16} className="text-slate-500"/>
              <input placeholder="Buscar conversa..." className="bg-transparent outline-none w-full placeholder-slate-600" />
           </div>
        </div>
        
        {/* Lista de Contatos */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              className={`p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                activeContact?.id === contact.id ? "bg-slate-800 border-l-4 border-red-600" : ""
              }`}
            >
              <div className="flex justify-between mb-1">
                <span className={`font-semibold ${activeContact?.id === contact.id ? "text-white" : "text-slate-300"}`}>
                   {contact.name || contact.whatsapp_number}
                </span>
                <span className="text-[10px] text-slate-500">
                  {contact.messages[0] 
                    ? new Date(contact.messages[0].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    : ''}
                </span>
              </div>
              <p className="text-sm text-slate-500 truncate">
                {contact.messages[0] ? contact.messages[0].content : "Iniciar conversa"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ÁREA DE CHAT */}
      <div className="flex-1 flex flex-col bg-slate-950 relative"> 
        
        {/* Background Pattern Opcional (Deixa mais premium) */}
        <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

        {activeContact ? (
          <>
            {/* Header Chat */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center gap-4 shadow-sm z-10">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center text-slate-300 border border-slate-700">
                <User size={20} />
              </div>
              <div>
                <h2 className="font-bold text-white">{activeContact.name || activeContact.whatsapp_number}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Phone size={10} /> {activeContact.whatsapp_number}
                </p>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 z-10 scroll-smooth">
              {messages.map((msg) => {
                const isMe = msg.direction === "outgoing";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[60%] p-3 rounded-xl shadow-md text-sm relative group ${
                        isMe 
                        ? "bg-red-600 text-white rounded-tr-none" // Cor da sua marca (Red Bull)
                        : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                      <span className={`text-[10px] block text-right mt-1 opacity-70 ${isMe ? "text-red-100" : "text-slate-500"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 z-10">
              <form onSubmit={handleSendMessage} className="flex gap-3 items-center max-w-4xl mx-auto">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-all"
                />
                <button
                  type="submit"
                  className="bg-red-600 text-white p-3.5 rounded-xl hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20 flex items-center justify-center"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 z-10">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
               <MessageSquare size={32} className="opacity-50" />
            </div>
            <p className="text-lg font-medium text-slate-500">Selecione um contato para iniciar</p>
            <p className="text-sm text-slate-700">BullAPI Chat System</p>
          </div>
        )}
      </div>
    </div>
  );
}