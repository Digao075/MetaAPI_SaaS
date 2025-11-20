"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import axios from "axios";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { LogOut, MessageSquare, LayoutDashboard, Loader2 } from "lucide-react";

const API_URL = "http://localhost:3333";


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
  OPEN: { title: "📥 Novos Leads", color: "bg-blue-100 text-blue-800" },
  PENDING: { title: "💬 Em Negociação", color: "bg-yellow-100 text-yellow-800" },
  CLOSED: { title: "✅ Fechados", color: "bg-green-100 text-green-800" },
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
    <div className="min-h-screen bg-gray-100 flex flex-col">

      <div className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <LayoutDashboard /> Pipeline de Vendas
        </h1>
        <div className="flex gap-4">
          <button 
            onClick={() => router.push("/chat")}
            className="text-gray-600 hover:text-blue-600 flex items-center gap-2 text-sm font-medium"
          >
            <MessageSquare size={18} /> Ir para Chat
          </button>
          <button 
            onClick={() => { localStorage.removeItem("saas_token"); router.push("/"); }}
            className="text-red-600 hover:text-red-800"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-[1000px]">
            
            {Object.entries(COLUMNS).map(([columnId, config]) => (
              <div key={columnId} className="flex-1 min-w-[300px] flex flex-col bg-gray-200 rounded-lg p-4">
                
                <div className={`font-bold mb-4 p-2 rounded text-center ${config.color}`}>
                  {config.title} ({columns[columnId]?.length || 0})
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
                              className={`bg-white p-4 rounded shadow-sm border-l-4 hover:shadow-md transition-all ${
                                snapshot.isDragging ? "rotate-2 scale-105 z-50 shadow-xl" : ""
                              } ${
                                columnId === 'OPEN' ? 'border-blue-400' : 
                                columnId === 'PENDING' ? 'border-yellow-400' : 'border-green-400'
                              }`}
                            >
                              <h3 className="font-bold text-gray-800">{contact.name || contact.whatsapp_number}</h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {contact.whatsapp_number}
                              </p>
                              {contact.messages[0] && (
                                <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded italic truncate">
                                  "{contact.messages[0].content}"
                                </div>
                              )}
                              <div className="mt-3 flex justify-end">
                                <button 
                                  onClick={() => router.push("/chat")}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Ver conversa →
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