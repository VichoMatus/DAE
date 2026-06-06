"use client";

import React from "react";
import { Briefcase, Package, Wrench, User, Coins, History, RefreshCw, Cpu, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface RoleSidebarProps {
  onReset: () => void;
  isResetting: boolean;
}

const roleMeta: Record<string, { label: string; badgeClass: string }> = {
  jefe_area: { label: "Jefe de Área", badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  bodega: { label: "Encargado Bodega", badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  ti: { label: "Técnico TI", badgeClass: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  colaborador: { label: "Colaborador", badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  finanzas: { label: "Finanzas", badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  auditor: { label: "Auditoría", badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
};

export default function RoleSidebar({
  onReset,
  isResetting
}: RoleSidebarProps) {
  const { user, logout } = useAuth();
  const meta = user ? roleMeta[user.role] : null;

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
          Sesión Activa
        </p>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Usuario</div>
            <div className="font-semibold text-slate-100">{user?.username ?? "-"}</div>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Rol</div>
            {meta ? (
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                {meta.label}
              </div>
            ) : (
              <div className="text-sm text-slate-400">-</div>
            )}
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar Sesión
          </button>
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
