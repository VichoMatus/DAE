"use client";

import React from "react";
import { HistoryLog } from "@/types";
import { Clock, ShieldAlert, ArrowRight, ShieldCheck, User2, MapPin } from "lucide-react";

interface AssetHistoryProps {
  logs: HistoryLog[];
  assetQr?: string;
}

export default function AssetHistory({ logs, assetQr }: AssetHistoryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "En Bodega": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "En Tránsito (Bodega-TI)": 
      case "En Tránsito (TI-Colaborador)": 
      case "En Tránsito (TI-Bodega)": 
      case "En Tránsito": return "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse";
      case "En Configuración": return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "Listo para Entrega": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "Pendiente de Recepción Formal": return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "Asignado": return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "Asignado (Extendido)": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "En Diagnóstico": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "Pendiente de Decisión": return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "Pendiente de Devolución": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "En Validación Técnica": return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "Disponible para Reasignación": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Incidente Externo": return "bg-red-500/10 text-red-400 border-red-500/20 font-bold";
      case "Dado de Baja": return "bg-slate-700/20 text-slate-400 border-slate-700/30";
      default: return "bg-slate-800 text-slate-400 border-transparent";
    }
  };

  const filteredLogs = assetQr 
    ? logs.filter(log => log.asset_qr === assetQr)
    : logs;

  // Show newest logs first in timeline
  const sortedLogs = [...filteredLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (sortedLogs.length === 0) {
    return (
      <div className="p-6 bg-slate-900/10 border border-slate-800 border-dashed rounded-xl text-center space-y-2">
        <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto opacity-75" />
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Activo recién ingresado al inventario</h4>
        <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
          Este equipo no posee historial de trazabilidad anterior. Su registro inicial ha sido guardado de forma inmutable y está listo para comenzar su ciclo de vida.
        </p>
      </div>
    );
  }

  return (
    <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-6">
      {sortedLogs.map((log, idx) => {
        const date = new Date(log.timestamp);
        const formattedDate = date.toLocaleString("es-CL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });

        return (
          <div key={idx} className="relative group">
            {/* Timeline bullet indicator */}
            <div className="absolute -left-[31px] top-1.5 bg-slate-950 border border-slate-800 rounded-full p-1 group-hover:border-violet-500 transition-colors">
              <Clock className="h-3 w-3 text-slate-400 group-hover:text-violet-400" />
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/40">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-semibold text-violet-400">{formattedDate}</span>
                <span className="text-xs text-slate-500 font-mono">QR: {log.asset_qr}</span>
              </div>

              {/* Status Transition Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-500 font-semibold px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md">
                  {log.from_status}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-500" />
                <span className={`text-xs font-semibold px-2 py-0.5 border rounded-md ${getStatusColor(log.to_status)}`}>
                  {log.to_status}
                </span>
              </div>

              {/* Transaction Motivo */}
              <p className="text-xs text-slate-300 font-medium mb-3 italic">
                &ldquo;{log.motivo}&rdquo;
              </p>

              {/* Emisor / Receptor */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider text-[9px] mb-0.5">Emisor</span>
                  <span className="font-semibold text-slate-300">{log.emisor}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase tracking-wider text-[9px] mb-0.5">Receptor</span>
                  <span className="font-semibold text-slate-300">{log.receptor}</span>
                </div>
              </div>

              {/* LEGAL SHIELD: Custody vs Administrative Responsibility */}
              <div className="grid grid-cols-2 gap-4 mt-3 pt-2.5 border-t border-dashed border-slate-800/60 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-orange-400/80 shrink-0" />
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Custodio Físico</span>
                    <span className="font-semibold text-slate-200">{log.custodio_fisico}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-400/80 shrink-0" />
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Resp. Administrativo</span>
                    <span className="font-semibold text-slate-200">{log.responsable_administrativo}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
