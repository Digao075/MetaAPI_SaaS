
"use client";

import { useState } from "react";
import { Check, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");


  const currentPlan = "FREE"; 


  const getPrice = (basePrice: number) => {
    if (basePrice === 0) return "R$ 0";
    if (billingCycle === "yearly") {

      const discounted = Math.floor(basePrice * 0.8); 
      return `R$ ${discounted}`;
    }
    return `R$ ${basePrice}`;
  };

const handleSubscribe = (planName: string) => {
    if (planName === "Starter") {
      window.open("https://www.asaas.com/c/seu-link-starter", "_blank");
    } else if (planName === "Bull Pro") {
      window.open("https://www.asaas.com/c/seu-link-pro", "_blank");
    }
  };
  const plans = [
    {
      name: "Free",
      basePrice: 0,
      description: "Para quem está começando",
      features: ["1 Conexão WhatsApp", "1 Usuário", "Kanban Básico", "Sem Webhooks"],
      active: currentPlan === "FREE",
      color: "border-slate-700",
      btnColor: "bg-slate-800 text-white",
      btnText: "Plano Atual"
    },
    {
      name: "Starter",
      basePrice: 97,
      description: "Para escalar a operação",
      features: ["3 Conexões WhatsApp", "5 Usuários", "Kanban Ilimitado", "Webhooks (n8n)"],
      active: currentPlan === "STARTER",
      color: "border-blue-600 shadow-lg shadow-blue-900/20",
      btnColor: "bg-blue-600 text-white hover:bg-blue-500",
      btnText: "Fazer Upgrade"
    },
    {
      name: "Bull Pro",
      basePrice: 197,
      description: "Poder total e automação",
      features: ["10 Conexões WhatsApp", "20 Usuários", "Suporte Prioritário", "API Dedicada"],
      active: currentPlan === "PRO",

      color: "border-red-600 shadow-lg shadow-red-900/20 relative", 
      btnColor: "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400",
      btnText: "Assinar Pro",
      badge: "MAIS POPULAR"
    }
    
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex flex-col items-center font-sans">
      
      <div className="w-full max-w-6xl mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-900 rounded-full transition text-slate-400 hover:text-white flex items-center gap-2">
            <ArrowLeft size={20} /> Voltar
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-4">Escolha o Plano Ideal</h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Desbloqueie todo o potencial do BullAPI e escale sua operação sem limites.
        </p>
      </div>


      <div className="bg-slate-900 p-1 rounded-lg flex items-center gap-2 mb-12 border border-slate-800">
        <button 
          onClick={() => setBillingCycle("monthly")}
          className={`px-6 py-2 rounded-md text-sm font-bold transition-all duration-300 ${
            billingCycle === 'monthly' ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Mensal
        </button>
        <button 
           onClick={() => setBillingCycle("yearly")}
           className={`px-6 py-2 rounded-md text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
             billingCycle === 'yearly' ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-500 hover:text-slate-300'
           }`}
        >
          Anual <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 rounded border border-green-500/30">-20%</span>
        </button>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {plans.map((plan) => (
          <div key={plan.name} className={`bg-slate-900 rounded-2xl p-8 border flex flex-col transition-all duration-300 ${plan.color}`}>
            {plan.badge && (
              <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full absolute -top-3 left-1/2 -translate-x-1/2 shadow-lg shadow-red-900/50">
                {plan.badge}
              </div>
            )}

            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
            <p className="text-slate-500 text-sm mt-2 mb-6">{plan.description}</p>
            
            <div className="mb-6">
              <div className="flex items-end gap-1">

                <span className="text-4xl font-bold text-white transition-all duration-300">
                  {getPrice(plan.basePrice)}
                </span>
                <span className="text-slate-500 mb-1">/mês</span>
              </div>
              {billingCycle === 'yearly' && plan.basePrice > 0 && (
                <p className="text-xs text-green-400 mt-2">
                  Faturado R$ {Math.floor(plan.basePrice * 0.8 * 12)} anualmente
                </p>
              )}
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="bg-slate-950 p-1 rounded-full text-green-500 border border-slate-800">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  {feat}
                </li>
              ))}
            </ul>

            <button 
              disabled={plan.active}
              onClick={() => handleSubscribe(plan.name)}
              className={`w-full py-3 rounded-lg font-bold transition-all ${plan.btnColor} ${plan.active ? 'opacity-50 cursor-default' : 'shadow-lg'}`}
            >
              {plan.active ? "Seu Plano Atual" : plan.btnText}
            </button>
          </div>
        ))}
      </div>
      
    </div>
  );
}