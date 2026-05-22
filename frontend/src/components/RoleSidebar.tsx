"use client";

import React from "react";
import { 
  Briefcase, 
  Package, 
  Wrench, 
  User, 
  Coins, 
  History, 
  RefreshCw,
  Cpu
} from "lucide-react";

interface RoleSidebarProps {
  currentRole: string;
  setRole: (role: string) => void;
  onReset: () => void;
  isResetting: boolean;
}

export default function RoleSidebar({ 
  currentRole, 
  setRole, 
  onReset,
  isResetting
}: RoleSidebarProps) {
  
  const roles = [
    { id: "Jefe de Área", name: "Jefe de Área", icon: Briefcase, color: "text-blue-400", desc: "Crea solicitudes y gestiona cese" },
    { id: "Encargado de Bodega", name: "Encargado de Bodega", icon: Package, color: "text-emerald-400", desc: "Evalúa D1 (Stock) y transfiere a TI" },
    { id: "Técnico TI", name: "Técnico TI", icon: Wrench, color: "text-violet-400", desc: "Configura, valida y diagnostica (D2)" },
    { id: "Colaborador", name: "Colaborador", icon: User, color: "text-amber-400", desc: "Firma recepción y reporta incidentes" },
    { id: "Finanzas", name: "Finanzas", icon: Coins, color: "text-rose-400", desc: "Decisiones de baja y extensión (D3)" },
    { id: "Auditoría / Supervisor", name: "Auditoría", icon: History, color: "text-cyan-400", desc: "Trazabilidad inmutable y custodias" },
  ];

  return (
    <aside className="w-80 glass-panel border-r border-slate-800 flex flex-col justify-between h-screen fixed left-0 top-0 z-20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-violet-600/20 rounded-xl border border-violet-500/30">
            <Cpu className="h-6 w-6 text-violet-400 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white">DAE ACTIVA</h1>
            <p className="text-xs text-slate-400 font-medium">Sistema de Control de Activos</p>
          </div>
        </div>

        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Conmutador de Experiencia
        </p>

        <div className="space-y-2">
          {roles.map((role) => {
            const Icon = role.icon;
            const isActive = currentRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setRole(role.id)}
                className={`w-full flex items-start gap-4 p-3.5 rounded-xl transition-all duration-300 text-left ${
                  isActive 
                    ? "bg-gradient-to-r from-violet-600/20 to-indigo-600/10 border border-violet-500/30 text-white shadow-lg shadow-violet-500/5" 
                    : "hover:bg-slate-800/40 border border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${role.color} ${isActive ? "scale-110" : ""}`} />
                <div>
                  <div className="font-semibold text-sm leading-tight">{role.name}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{role.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-950/40">
        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-1">Estado de Operaciones</div>
          <div className="text-sm font-semibold text-slate-200">22 de Mayo de 2026</div>
        </div>
        <button
          onClick={onReset}
          disabled={isResetting}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`} />
          {isResetting ? "Restableciendo..." : "Restablecer Base de Datos"}
        </button>
      </div>
    </aside>
  );
}
