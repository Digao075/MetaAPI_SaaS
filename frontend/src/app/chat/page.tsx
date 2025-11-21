"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { MessageSquare, Send, User, Phone, LogOut, ArrowLeft, Search, Paperclip, File, Image as ImageIcon, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "SUA_PROJECT_URL_DO_SUPABASE";
const SUPABASE_KEY = "SUA_ANON_KEY_DO_SUPABASE";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";
const API_URL = `${BASE_URL}/v1/meta/webhook`;
const SOCKET_URL = BASE_URL;

interface TokenPayload { userId: string; email: string; tenantId: string; }

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
  const [isUploading, setIsUploading] = useState(false);

  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (activeContact && myTenantId) fetchMessages(activeContact.id);
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
    await sendToBackend(textToSend, "text");
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !activeContact) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${myTenantId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      let type = "document";
      if (file.type.startsWith("image/")) type = "image";
      if (file.type.startsWith("audio/")) type = "audio";
      if (file.type.startsWith("video/")) type = "video";


      await sendToBackend(publicUrl, type, file.name);

    } catch (error) {
      console.error("Erro upload", error);
      alert("Erro ao enviar arquivo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  const sendToBackend = async (content: string, type: string, caption?: string) => {
    try {
      await axios.post(`${API_URL}/send-media`, { 
        tenantId: myTenantId,
        userId: myUserId,
        contactWaId: activeContact.whatsapp_number,
        content: content, 
        type: type,       
        caption: caption  
      });
    } catch (error) { console.error(error); }
  };


  const renderMessageContent = (msg: any) => {
    if (msg.messageType === 'image') {
      return <img src={msg.content} alt="Imagem" className="max-w-full rounded-lg cursor-pointer" onClick={() => window.open(msg.content, '_blank')} />;
    }
    if (msg.messageType === 'audio') {
      return <audio controls src={msg.content} className="w-64" />;
    }
    if (msg.messageType === 'document') {
      return (
        <a href={msg.content} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/10 p-2 rounded text-inherit hover:underline">
          <File size={20} /> {msg.content.split('/').pop() || "Documento"}
        </a>
      );
    }
    return <p className="leading-relaxed">{msg.content}</p>;
  };

  if (!myTenantId) return <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">Carregando Chat...</div>;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      
      <div className="w-1/3 max-w-sm bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between">
           <button onClick={() => router.push("/dashboard")}><ArrowLeft className="text-slate-400"/></button>
           <h1 className="font-bold">Conversas</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <div key={contact.id} onClick={() => setActiveContact(contact)} className={`p-4 border-b border-slate-800 cursor-pointer ${activeContact?.id === contact.id ? "bg-slate-800 border-l-4 border-red-600" : ""}`}>
              <div className="flex justify-between"><span className="font-semibold">{contact.name || contact.whatsapp_number}</span></div>
              <p className="text-sm text-slate-500 truncate">
                 {contact.messages[0]?.messageType === 'image' ? '📷 Imagem' : contact.messages[0]?.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-950 relative"> 
        <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

        {activeContact ? (
          <>
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center gap-4 shadow-sm z-10">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center"><User size={20} /></div>
              <div><h2 className="font-bold">{activeContact.name || activeContact.whatsapp_number}</h2></div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 z-10 scroll-smooth">
              {messages.map((msg) => {
                const isMe = msg.direction === "outgoing";
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[60%] p-3 rounded-xl shadow-md text-sm ${isMe ? "bg-red-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none"}`}>
                      {renderMessageContent(msg)}
                      <span className={`text-[10px] block text-right mt-1 opacity-70`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 z-10">
              <div className="flex gap-3 items-center max-w-4xl mx-auto">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
                  disabled={isUploading}
                >
                  {isUploading ? <span className="animate-spin">⏳</span> : <Paperclip size={20} />}
                </button>
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   onChange={handleFileUpload}
                   accept="image/*,audio/*,video/*,application/pdf" 
                />

                <form onSubmit={handleSendMessage} className="flex-1 flex gap-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-red-900"
                  />
                  <button type="submit" className="bg-red-600 text-white p-3.5 rounded-xl hover:bg-red-500"><Send size={20} /></button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 z-10"><p>Selecione um contato</p></div>
        )}
      </div>
    </div>
  );
}