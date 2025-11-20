"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import axios from "axios";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { LogOut, MessageSquare, LayoutDashboard, Loader2, ArrowLeft, ArrowUpRight } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3333";

const API_URL = `${BASE_URL}`; 
const SOCKET_URL = `${BASE_URL}`;

interface Contact {
  id: string;
  name: string | null;
  whatsapp_number: string;
  status: string;
  messages: any[];
}

interface TokenPayload {
  userId: string;
  tenantId: string;
}

const COLUMNS = {
  OPEN: { title: "📥 Novos Leads", color: "bg-blue-900/20 text-blue-400 border-blue-800" },
  PENDING: { title: "💬 Em Negociação", color: "bg-yellow-900/20 text-yellow-400 border-yellow-800" },
  CLOSED: { title: "✅ Fechados", color: "bg-green-900/20 text-green-400 border-green-800" },
};

export default function KanbanPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tenantId, setTenantId] = useState("");
  
  const [columns, setColumns] = useState<{ [key: string]: Contact[] }>({
    OPEN: [],
    PENDING: [],
    CLOSED: [],
  });
  
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const savedToken = localStorage.getItem("saas_token");
    if (!savedToken) {
      router.push("/");
      return;
    }
    try {
      const decoded = jwtDecode<TokenPayload>(savedToken);
      setToken(savedToken);
      setTenantId(decoded.tenantId);
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    } catch (error) {
      router.push("/");
    }
  }, [router]);
  useEffect(() => {
    if (tenantId) fetchKanbanData();
  }, [tenantId]);

  const fetchKanbanData = async () => {
    try {
      const res = await axios.get(`${API_URL}/v1/meta/webhook/chat/${tenantId}/contacts`);
      const allContacts: Contact[] = res.data;
      const newColumns: any = { OPEN: [], PENDING: [], CLOSED: [] };
      
      allContacts.forEach(contact => {
        const status = contact.status || "OPEN"; 
        if (newColumns[status]) {
          newColumns[status].push(contact);
        } else {

          newColumns["OPEN"].push(contact);
        }
      });

      setColumns(newColumns);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao carregar Kanban", error);
      setIsLoading(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    const startColumn = source.droppableId;
    const endColumn = destination.droppableId;
    const newColumns = { ...columns };
    const [movedContact] = newColumns[startColumn].splice(source.index, 1);
    

    movedContact.status = endColumn;


    newColumns[endColumn].splice(destination.index, 0, movedContact);


    setColumns(newColumns);

    try {
      await axios.post(
        `${API_URL}/v1/meta/webhook/chat/${tenantId}/contacts/${draggableId}/status`,
        { status: endColumn }
      );
      console.log(`Card ${draggableId} movido para ${endColumn}`);
    } catch (error) {
      console.error("Erro ao salvar movimento", error);
      alert("Erro ao mover card. Recarregando...");
      fetchKanbanData(); 
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
             <button onClick={() => router.push("/dashboard")} className="text-slate-400 hover:text-white">
                <ArrowLeft size={20} />
             </button>
             <h1 className="text-xl font-bold text-white flex items-center gap-2">
               <LayoutDashboard className="text-red-500" /> Pipeline de Vendas
             </h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => router.push("/chat")}
            className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <MessageSquare size={18} /> Ir para Chat
          </button>
          <button 
            onClick={() => { localStorage.removeItem("saas_token"); router.push("/"); }}
            className="text-slate-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-[1000px]">
            
            {Object.entries(COLUMNS).map(([columnId, config]) => (
              <div key={columnId} className="flex-1 min-w-[300px] flex flex-col bg-slate-900/50 rounded-xl p-4 border border-slate-800/50">
                
                <div className={`font-bold mb-4 p-3 rounded-lg text-center border ${config.color} bg-opacity-10`}>
                  {config.title} <span className="ml-2 opacity-60 text-xs">({columns[columnId]?.length || 0})</span>
                </div>

                <Droppable droppableId={columnId}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex-1 space-y-3 min-h-[100px]"
                    >
                      {columns[columnId]?.map((contact, index) => (
                        <Draggable key={contact.id} draggableId={contact.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-slate-800 p-4 rounded-lg shadow-lg border hover:border-slate-600 transition-all group ${
                                snapshot.isDragging ? "rotate-2 scale-105 z-50 shadow-red-900/20 border-red-500" : "border-slate-700"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                 <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors">{contact.name || contact.whatsapp_number}</h3>
                                 <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-700">
                                    #{index + 1}
                                 </span>
                              </div>
                              
                              <p className="text-xs text-slate-500 mt-1 font-mono">
                                {contact.whatsapp_number}
                              </p>
                              
                              {contact.messages[0] && (
                                <div className="mt-3 text-xs text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800/50 italic truncate">
                                  "{contact.messages[0].content}"
                                </div>
                              )}
                              <div className="mt-3 flex justify-end border-t border-slate-700/50 pt-2">
                                <button 
                                  onClick={() => router.push("/chat")}
                                  className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1"
                                >
                                  Ver conversa <ArrowUpRight size={10} />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}

          </div>
        </DragDropContext>
      </div>
    </div>
  );
}