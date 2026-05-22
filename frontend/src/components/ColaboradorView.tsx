"use client";

import React, { useState } from "react";
import { Asset } from "@/types";
import { User, PenTool, ShieldAlert, Award, FileText, CheckCircle } from "lucide-react";

interface ColaboradorViewProps {
  assets: Asset[];
  onTransitionAsset: (qr: string, status: string, emisor: string, receptor: string, motivo: string) => Promise<boolean>;
  onReportIncident: (qr: string, policeReportNum: string, description: string) => Promise<boolean>;
  isLoading: boolean;
}

export default function ColaboradorView({
  assets,
  onTransitionAsset,
  onReportIncident,
  isLoading
}: ColaboradorViewProps) {
  const [signatureName, setSignatureName] = useState("");
  const [selectedAssetQr, setSelectedAssetQr] = useState("");
  const [policeReportNum, setPoliceReportNum] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter assets waiting for receipt or currently assigned
  const pendingAssets = assets.filter(
    (a) => a.status === "Pendiente de Recepción Formal"
  );
  
  const activeAssets = assets.filter(
    (a) => a.status === "Asignado" || a.status === "Asignado (Extendido)"
  );

  const handleSignReception = async (qr: string) => {
    if (!signatureName.trim()) {
      alert("Por favor, escribe tu nombre completo para estampar la firma digital.");
      return;
    }

    const success = await onTransitionAsset(
      qr,
      "Asignado",
      "Colaborador",
      signatureName,
      `Acta digital firmada formalmente por ${signatureName}. Recepción física conforme del activo.`
    );

    if (success) {
      setSignatureName("");
    }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetQr || !policeReportNum || !incidentDescription) {
      setMsg({ type: "error", text: "Por favor, completa todos los campos del reporte de incidentes." });
      return;
    }

    setMsg(null);
    const success = await onReportIncident(selectedAssetQr, policeReportNum, incidentDescription);

    if (success) {
      setMsg({ 
        type: "success", 
        text: `Incidente registrado con éxito. Activo cambiado a estado de auditoría 'Incidente Externo'.` 
      });
      setPoliceReportNum("");
      setIncidentDescription("");
      setSelectedAssetQr("");
      setShowIncidentForm(false);
    } else {
      setMsg({ type: "error", text: "Error al registrar el incidente en el servidor." });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Portal del Colaborador</h2>
          <p className="text-xs text-slate-400">Recepción de Hardware, Firma de Actas de Custodia y Reporte de Incidentes</p>
        </div>
      </div>

      {/* 1. Firma de Recepción Formal (Pendientes) */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-6">
        <div>
          <h3 className="text-md font-bold text-white">Actas de Entrega Pendientes de Firma</h3>
          <p className="text-xs text-slate-400 mt-0.5">Debes firmar digitalmente el acta para desbloquear la custodia legal y asumir responsabilidad.</p>
        </div>

        {pendingAssets.length === 0 ? (
          <div className="text-xs text-slate-500 italic border border-slate-800 border-dashed rounded-xl p-6 text-center">
            No tienes equipos pendientes de recepción formal.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAssets.map((asset) => (
              <div key={asset.qr_code} className="p-5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4 max-w-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">{asset.qr_code}</span>
                    <h4 className="text-sm font-bold text-slate-200 mt-1.5">{asset.category}</h4>
                    <p className="text-xs text-slate-400">Especificaciones: {asset.specs.processor} / {asset.specs.ram} / {asset.specs.storage}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                    Recepción Pendiente
                  </span>
                </div>

                {/* Acta content block */}
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg text-[11px] text-slate-400 space-y-2 leading-relaxed">
                  <p className="font-bold text-slate-300 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-amber-500" />
                    CLÁUSULA DE CUSTODIA Y RESPONSABILIDAD ADMINISTRATIVA
                  </p>
                  <p>
                    Al firmar este documento electrónico, declaro haber recibido el activo tecnológico código <strong className="text-slate-300">{asset.qr_code}</strong> en perfectas condiciones técnicas. 
                    Me constituyo como <strong>Custodio Físico</strong> directo y asumo la <strong>Responsabilidad Administrativa y Legal</strong> sobre su resguardo en teletrabajo o dependencias de la empresa, aislando a TI de responsabilidades por negligencia en caso de siniestro sin denuncia policial formal.
                  </p>
                </div>

                {/* Signature input pad */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Escribe tu nombre completo para estampar la firma digital</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Ej. Roberto Silva Matus"
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        className="flex-1 text-xs py-2 px-3 bg-slate-950 border border-slate-800 focus:border-violet-500 text-slate-200 rounded-lg outline-none font-mono"
                      />
                      <button
                        onClick={() => handleSignReception(asset.qr_code)}
                        disabled={isLoading || !signatureName}
                        className="py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <PenTool className="h-3.5 w-3.5" />
                        Estampar Firma y Recibir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Equipos Asignados Activos */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-md font-bold text-white">Mis Activos Asignados</h3>
            <p className="text-xs text-slate-400 mt-0.5">Listado de dispositivos tecnológicos bajo tu responsabilidad directa actual.</p>
          </div>
          {activeAssets.length > 0 && !showIncidentForm && (
            <button
              onClick={() => {
                setShowIncidentForm(true);
                setMsg(null);
              }}
              className="py-1.5 px-3 bg-rose-600/10 border border-rose-500/25 hover:bg-rose-600/20 text-rose-400 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
            >
              <ShieldAlert className="h-4 w-4" />
              Reportar Incidente (Robo/Siniestro)
            </button>
          )}
        </div>

        {activeAssets.length === 0 ? (
          <div className="text-xs text-slate-500 italic border border-slate-800 border-dashed rounded-xl p-6 text-center">
            No tienes equipos asignados de forma activa actualmente.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeAssets.map((asset) => (
              <div key={asset.qr_code} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">{asset.qr_code}</span>
                    <h4 className="text-sm font-bold text-slate-200 mt-1">{asset.category}</h4>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 border rounded ${
                    asset.status === "Asignado (Extendido)" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}>
                    {asset.status}
                  </span>
                </div>

                {/* Legal Shield visual validation */}
                <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/40 text-[11px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Custodio Físico (Posesión):</span>
                    <span className="text-slate-300 font-semibold">{asset.custodio_fisico}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-900 pt-1.5">
                    <span className="text-slate-500">Resp. Administrativo (Legal):</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {asset.responsable_administrativo}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 italic">
                  Garantía vence el: {asset.warranty_end_date} | Salud Batería: {100 - asset.battery_wear_pct}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Gestión de Incidentes Formulario (Robo / Siniestro) */}
      {showIncidentForm && (
        <div className="glass-card p-6 rounded-2xl border border-rose-500/30 bg-slate-900/10 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-md font-bold text-rose-400 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Registrar Incidente Externo (Auditoría de Siniestros)
              </h3>
              <p className="text-xs text-slate-400">Declara formalmente el robo o pérdida de un activo tecnológico en teletrabajo.</p>
            </div>
            <button
              onClick={() => setShowIncidentForm(false)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleReportIncident} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Activo Siniestrado</label>
                <select
                  value={selectedAssetQr}
                  onChange={(e) => setSelectedAssetQr(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-rose-500"
                >
                  <option value="">-- Selecciona el Activo --</option>
                  {activeAssets.map(a => (
                    <option key={a.qr_code} value={a.qr_code}>
                      [{a.qr_code}] {a.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">N° Denuncia Policial (Carabineros / PDI)</label>
                <input
                  type="text"
                  placeholder="Ej: DEN-88902-2026"
                  value={policeReportNum}
                  onChange={(e) => setPoliceReportNum(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-200 rounded-lg outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Descripción y Circunstancias del Suceso</label>
              <textarea
                placeholder="Describe brevemente cómo ocurrió el siniestro (robo de mochila en trayecto, pérdida por anegamiento, etc.)."
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                rows={3}
                className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-200 rounded-lg outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !selectedAssetQr || !policeReportNum}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Estampar Denuncia y Enviar a Auditoría
            </button>
          </form>
        </div>
      )}

      {msg && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
          msg.type === "success" 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
        }`}>
          <PenTool className="h-4 w-4 shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}
    </div>
  );
}
