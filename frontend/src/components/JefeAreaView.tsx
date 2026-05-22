"use client";

import React, { useState } from "react";
import { AllocationRequest, Asset } from "@/types";
import { Briefcase, Send, AlertCircle, RefreshCw, Undo2 } from "lucide-react";

interface JefeAreaViewProps {
  assets: Asset[];
  requests: AllocationRequest[];
  onCreateRequest: (data: any) => Promise<boolean>;
  onTransitionAsset: (qr: string, status: string, emisor: string, receptor: string, motivo: string) => Promise<boolean>;
  isLoading: boolean;
}

export default function JefeAreaView({
  assets,
  requests,
  onCreateRequest,
  onTransitionAsset,
  isLoading
}: JefeAreaViewProps) {
  const [collaborator, setCollaborator] = useState("");
  const [profile, setProfile] = useState("Desarrollador / TI");
  const [category, setCategory] = useState("MacBook Pro M3");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collaborator || !reason) {
      setMsg({ type: "error", text: "Por favor, completa todos los campos del formulario." });
      return;
    }

    setMsg(null);
    const success = await onCreateRequest({
      collaborator,
      collaborator_profile: profile,
      category_requested: category,
      reason
    });

    if (success) {
      setMsg({ type: "success", text: "Solicitud de asignación enviada con éxito a Bodega." });
      setCollaborator("");
      setReason("");
    } else {
      setMsg({ type: "error", text: "Error al enviar la solicitud de asignación." });
    }
  };

  // Filter assets currently assigned
  const assignedAssets = assets.filter(
    (a) => a.status === "Asignado" || a.status === "Asignado (Extendido)"
  );

  return (
    <div className="space-y-8">
      {/* View Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
          <Briefcase className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Panel de Jefe de Área</h2>
          <p className="text-xs text-slate-400">Planificación de Hardware, Asignación de Recursos y Ciclo de Retiro</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Creation Form */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10">
          <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
            Crear Solicitud de Asignación
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Nombre del Colaborador
              </label>
              <input
                type="text"
                value={collaborator}
                onChange={(e) => setCollaborator(e.target.value)}
                placeholder="Ej. Roberto Silva"
                className="w-full text-sm py-2 px-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-violet-500 text-slate-200 rounded-lg outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                  Perfil de Cargo (D1)
                </label>
                <select
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  className="w-full text-sm py-2 px-3 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-violet-500"
                >
                  <option value="Desarrollador / TI">Desarrollador / TI</option>
                  <option value="Administrativo / Finanzas">Administrativo / Finanzas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                  Categoría Solicitada
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm py-2 px-3 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-violet-500"
                >
                  <option value="MacBook Pro M3">MacBook Pro M3</option>
                  <option value="Dell Latitude 5440">Dell Latitude 5440</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                Justificación Comercial
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Colaborador senior requiere equipo potente para desarrollo móvil."
                rows={3}
                className="w-full text-sm py-2 px-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-violet-500 text-slate-200 rounded-lg outline-none resize-none transition-all"
              />
            </div>

            {msg && (
              <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                msg.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}>
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{msg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              Enviar Solicitud
            </button>
          </form>
        </div>

        {/* Requests List */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-white mb-4">
              Solicitudes Recientes
            </h3>
            {requests.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No hay solicitudes pendientes o procesadas.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {[...requests].reverse().map((req) => (
                  <div key={req.id} className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-400">{req.id}</span>
                        <span className="text-[11px] text-slate-400">({req.collaborator_profile})</span>
                      </div>
                      <div className="text-xs text-slate-200 font-semibold">{req.collaborator} &rarr; {req.category_requested}</div>
                      <div className="text-[10px] text-slate-500 italic line-clamp-1">&ldquo;{req.reason}&rdquo;</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full shrink-0 ${
                      req.status.includes("Aprobado") 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Return Flow Section */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10">
        <h3 className="text-md font-bold text-white mb-1 flex items-center gap-2">
          Ciclo de Cese y Devolución de Activos
        </h3>
        <p className="text-xs text-slate-400 mb-4">Solicita el retorno de los dispositivos de colaboradores desvinculados para higienización técnica.</p>

        {assignedAssets.length === 0 ? (
          <div className="text-xs text-slate-500 italic border border-slate-800 border-dashed rounded-xl p-6 text-center">
            No hay equipos en estado de asignación activa actualmente.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedAssets.map((asset) => (
              <div key={asset.qr_code} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 border border-slate-800 rounded text-slate-400">{asset.qr_code}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded ${
                      asset.status === "Asignado (Extendido)" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    }`}>
                      {asset.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">{asset.category}</h4>
                  <div className="text-xs text-slate-400">Asignado a: <strong className="text-slate-300">{asset.assigned_to}</strong></div>
                  <div className="text-[11px] text-slate-500">Resp. Legal: {asset.responsable_administrativo}</div>
                </div>

                <button
                  onClick={() => onTransitionAsset(
                    asset.qr_code,
                    "Pendiente de Devolución",
                    "Jefe de Área",
                    "Transportista / Tránsito",
                    `Solicitud de devolución por término de funciones del colaborador ${asset.assigned_to}`
                  )}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-yellow-600/10 border border-yellow-500/20 hover:bg-yellow-600/20 text-yellow-400 text-xs font-semibold rounded-lg transition-all"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Solicitar Retorno Físico
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
