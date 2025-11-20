"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { MessageSquare, Send, User, Phone, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode"; 

const API_URL = "http://localhost:3333"; 
const SOCKET_URL = "http://localhost:3333";


interface TokenPayload {
  userId: string;
  email: string;
  tenantId: string;
  sub: string;
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

    if (!savedToken) {

      router.push("/");
      return;
    }

    try {

      const decoded = jwtDecode<TokenPayload>(savedToken);
      setToken(savedToken);
      setMyUserId(decoded.userId);
      setMyTenantId(decoded.tenantId);
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;

    } catch (error) {
      console.error("Token inválido", error);
      localStorage.removeItem("saas_token");
      router.push("/");
    }
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

    return () => {
      socket.disconnect();
    };
  }, [myTenantId, token, activeContact]); 

  useEffect(() => {
    if (activeContact && myTenantId) {
      fetchMessages(activeContact.id);
    }
  }, [activeContact, myTenantId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${API_URL}/v1/meta/webhook/chat/${myTenantId}/contacts`);
      setContacts(res.data);
    } catch (error) {
      console.error("Erro ao buscar contatos", error);
    }
  };

  const fetchMessages = async (contactId: string) => {
    try {
      const res = await axios.get(`${API_URL}/v1/meta/webhook/chat/${myTenantId}/messages/${contactId}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (error) {
      console.error("Erro ao buscar mensagens", error);
    }
  };

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContact) return;

    const textToSend = inputText;
    setInputText("");

    try {
      await axios.post(`${API_URL}/v1/meta/webhook/send-text`, {
        tenantId: myTenantId, 
        userId: myUserId,     
        contactWaId: activeContact.whatsapp_number,
        text: textToSend,
      });
    } catch (error) {
      console.error("Erro ao enviar", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("saas_token");
    router.push("/");
  };

  if (!myTenantId) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-xl text-gray-800">Chats</h1>
            <p className="text-xs text-gray-500">Tenant: {myTenantId}</p>
          </div>
          <div className="flex gap-2 items-center">
             <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
             <button onClick={handleLogout} className="p-2 hover:bg-gray-200 rounded-full" title="Sair">
                <LogOut size={18} />
             </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                activeContact?.id === contact.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
              }`}
            >
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-gray-800">{contact.name || contact.whatsapp_number}</span>
                <span className="text-xs text-gray-500">
                  {contact.messages[0] 
                    ? new Date(contact.messages[0].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    : ''}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {contact.messages[0] ? contact.messages[0].content : "Iniciar conversa"}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-[#e5ddd5]"> 
        {activeContact ? (
          <>
            <div className="p-3 bg-gray-100 border-b flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                <User size={20} />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">{activeContact.name || activeContact.whatsapp_number}</h2>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone size={10} /> {activeContact.whatsapp_number}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.direction === "outgoing";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg shadow-sm text-sm ${
                        isMe ? "bg-[#d9fdd3] text-gray-800 rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <span className="text-[10px] text-gray-500 block text-right mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-gray-100 flex gap-2 items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Digite uma mensagem"
                className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="bg-[#00a884] text-white p-3 rounded-lg hover:bg-[#008f6f] transition-colors"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p className="text-lg">Selecione um contato para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}