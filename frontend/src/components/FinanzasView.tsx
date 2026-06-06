"use client";

import React, { useState } from "react";
import { Asset, HistoryLog } from "@/types";
import { 
  Coins, 
  Trash2, 
  PlusCircle, 
  AlertOctagon, 
  History, 
  HelpCircle,
  FileCheck2,
  FileText,
  HeartPulse,
  Scale
} from "lucide-react";
import AssetHistory from "./AssetHistory";

interface FinanzasViewProps {
  assets: Asset[];
  logs: HistoryLog[];
  onFinanceDecision: (qr: string, action: "baja" | "extension", justification?: string, motivo?: string) => Promise<boolean>;
  isLoading: boolean;
}

export default function FinanzasView({
  assets,
  logs,
  onFinanceDecision,
  isLoading
}: FinanzasViewProps) {
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [motivosBaja, setMotivosBaja] = useState<Record<string, string>>({});
  const [selectedAssetForHistory, setSelectedAssetForHistory] = useState<string | null>(null);

  const decisionAssets = assets.filter(
    (a) => a.status === "Pendiente de Decisión"
  );
  
  const incidentAssets = assets.filter(
    (a) => a.status === "Incidente Externo"
  );

  const handleDecision = async (qr: string, action: "baja" | "extension") => {
    const asset = assets.find((a) => a.qr_code === qr);
    if (!asset) return;

    if (action === "extension") {
      const needsJustification = asset.battery_wear_pct >= 30 || asset.previous_failures_count >= 3;
      const just = justifications[qr] || "";
      
      if (needsJustification && !just.trim()) {
        alert("Se requiere justificación excepcional obligatoria de Finanzas para extender la vida útil.");
        return;
      }

      const success = await onFinanceDecision(qr, "extension", just);
      if (success) {
        setJustifications(prev => ({ ...prev, [qr]: "" }));
      }
    } else {
      // Write off (Baja)
      const motivo = motivosBaja[qr] || "Baja por costos de reparación excesivos o depreciación total";
      const success = await onFinanceDecision(qr, "baja", undefined, motivo);
      if (success) {
        setMotivosBaja(prev => ({ ...prev, [qr]: "" }));
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
          <Coins className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Consola de Control y Auditoría Financiera - DAE</h2>
          <p className="text-xs text-slate-400">Evaluación de Activos Siniestrados, Compuerta D3 de Extensión y Depreciación Contable</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Decision Lists */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* 1. Decisiones D3 (Pendientes de Decisión) */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-6">
            <div>
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Scale className="h-5 w-5 text-rose-400" />
                Decisiones Financieras Pendientes (Compuerta D3)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Equipos retenidos por alto costo de reparación o vida útil remanente insuficiente en diagnóstico.</p>
            </div>

            {decisionAssets.length === 0 ? (
              <div className="text-xs text-slate-500 italic border border-slate-800 border-dashed rounded-xl p-6 text-center">
                No hay activos pendientes de evaluación financiera.
              </div>
            ) : (
              <div className="space-y-6">
                {decisionAssets.map((asset) => {
                  const needsJustification = asset.battery_wear_pct >= 30 || asset.previous_failures_count >= 3;
                  const justText = justifications[asset.qr_code] || "";
                  
                  return (
                    <div key={asset.qr_code} className="p-5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
                      {/* Asset Summary */}
                      <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-900 pb-3">
                        <div>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">{asset.qr_code}</span>
                          <h4 className="text-sm font-bold text-slate-200 mt-1.5">{asset.category}</h4>
                          <p className="text-xs text-slate-400">Asignado a: <strong className="text-slate-300">{asset.assigned_to}</strong></p>
                        </div>
                        <button
                          onClick={() => setSelectedAssetForHistory(
                            selectedAssetForHistory === asset.qr_code ? null : asset.qr_code
                          )}
                          className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg text-xs"
                        >
                          <History className="h-3.5 w-3.5" />
                          {selectedAssetForHistory === asset.qr_code ? "Cerrar Historial" : "Ver Trazabilidad"}
                        </button>
                      </div>

                      {/* Depreciation Matrix */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-slate-950/80 border border-slate-800/40 rounded-lg text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">Valor Libro</span>
                          <span className="font-bold text-emerald-400 font-mono">${asset.book_value.toLocaleString("es-CL")} CLP</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">Costo Rep.</span>
                          <span className="font-bold text-rose-400 font-mono">${asset.repair_cost?.toLocaleString("es-CL")} CLP</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">Reposición</span>
                          <span className="font-bold text-slate-300 font-mono">${asset.new_equipment_price.toLocaleString("es-CL")} CLP</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">Vida Restante</span>
                          <span className="font-bold text-slate-300">{asset.remaining_months} meses</span>
                        </div>
                      </div>

                      {/* Health Metrics (D3 Rules) */}
                      <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900 text-xs space-y-2">
                        <div className="font-semibold text-slate-300 flex items-center gap-1">
                          <HeartPulse className="h-3.5 w-3.5 text-violet-400" />
                          Métricas de Salud Operativa del Activo:
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Desgaste Batería:</span>
                            <span className={`font-semibold ${asset.battery_wear_pct >= 30 ? "text-rose-400" : "text-emerald-400"}`}>
                              {asset.battery_wear_pct}% {asset.battery_wear_pct >= 30 ? "(Excede 30%)" : "(Óptimo)"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Fallas Previas:</span>
                            <span className={`font-semibold ${asset.previous_failures_count >= 3 ? "text-rose-400" : "text-emerald-400"}`}>
                              {asset.previous_failures_count} {asset.previous_failures_count >= 3 ? "(Excede 3)" : "(Frecuencia Baja)"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* History dropdown */}
                      {selectedAssetForHistory === asset.qr_code && (
                        <div className="p-4 bg-slate-950 border border-slate-900 rounded-lg max-h-[300px] overflow-y-auto">
                          <h5 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Historial de Custodia e Inmutabilidad</h5>
                          <AssetHistory logs={logs} assetQr={asset.qr_code} />
                        </div>
                      )}

                      {/* Warnings if D3 checks fail */}
                      {needsJustification && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs space-y-1.5">
                          <strong className="flex items-center gap-1.5 text-rose-400 font-bold">
                            <AlertOctagon className="h-4 w-4 text-rose-500 shrink-0" />
                            ALERTA EXCEPCIÓN D3: Parámetros Excedidos
                          </strong>
                          <p className="leading-relaxed text-[10.5px]">
                            El hardware posee desgaste de batería crítico o fallas frecuentes. La extensión por 12 meses requiere una <strong>Justificación Excepcional Contable</strong> por parte de Finanzas.
                          </p>
                          <textarea
                            placeholder="Escribe el justificativo contable excepcional aquí (Obligatorio para aprobar extensión)."
                            value={justText}
                            onChange={(e) => setJustifications(prev => ({ ...prev, [asset.qr_code]: e.target.value }))}
                            rows={2}
                            className="w-full text-xs py-1.5 px-2 bg-slate-950 border border-slate-900 focus:border-rose-500 text-slate-200 rounded outline-none resize-none"
                          />
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="Motivo de la baja contable..."
                            value={motivosBaja[asset.qr_code] || ""}
                            onChange={(e) => setMotivosBaja(prev => ({ ...prev, [asset.qr_code]: e.target.value }))}
                            className="w-full text-[11px] py-1.5 px-2 bg-slate-950 border border-slate-900 focus:border-rose-500 text-slate-300 rounded"
                          />
                          <button
                            onClick={() => handleDecision(asset.qr_code, "baja")}
                            disabled={isLoading}
                            className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Dar de Baja Definitiva
                          </button>
                        </div>

                        <div className="flex-1 flex flex-col justify-end">
                          <button
                            onClick={() => handleDecision(asset.qr_code, "extension")}
                            disabled={isLoading || (needsJustification && !justText.trim())}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Autorizar Extensión (1 Año)
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Incidentes en Teletrabajo (Robos/Pérdidas) */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-6">
            <div>
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-rose-400 animate-pulse" />
                Incidentes Externos Registrados (Denuncias en Curso)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Audita las denuncias policiales cargadas por robo de activos para autorizar la liquidación contable.</p>
            </div>

            {incidentAssets.length === 0 ? (
              <div className="text-xs text-slate-500 italic border border-slate-800 border-dashed rounded-xl p-6 text-center">
                No hay incidentes externos activos reportados.
              </div>
            ) : (
              <div className="space-y-4">
                {incidentAssets.map(asset => (
                  <div key={asset.qr_code} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">{asset.qr_code}</span>
                        <h4 className="text-sm font-bold text-slate-200 mt-1">{asset.category}</h4>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded uppercase">
                        Siniestro
                      </span>
                    </div>

                    {/* Police report information */}
                    {asset.incident_details && (
                      <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Denuncia Carabineros N°:</span>
                          <strong className="text-rose-400 font-mono">{asset.incident_details.police_report_num}</strong>
                        </div>
                        <div className="text-[11px] text-slate-400 leading-relaxed italic">
                          &ldquo;{asset.incident_details.description}&rdquo;
                        </div>
                        <div className="text-[10px] text-slate-500 border-t border-slate-900 pt-1.5">
                          Reportado por: {asset.incident_details.reported_by} el {new Date(asset.incident_details.reported_at).toLocaleString()}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[11px]">
                      <div className="text-slate-400">Responsable Administrativo (Legal): <strong className="text-slate-200">{asset.responsable_administrativo}</strong></div>
                    </div>

                    <button
                      onClick={() => onFinanceDecision(asset.qr_code, "baja", undefined, `Baja por siniestro respaldado por denuncia policial N° ${asset.incident_details?.police_report_num}`)}
                      disabled={isLoading}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Aprobar Baja Contable por Siniestro
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Dynamic linear depreciation rules info */}
        <div>
          <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-4 sticky top-6">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Depreciación Lineal Simple DAE</h3>
            
            <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl space-y-3 text-xs leading-relaxed text-slate-400">
              <p>
                Los activos tecnológicos se deprecian mensualmente de forma lineal. 
              </p>
              <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg text-slate-300 font-mono text-[10.5px]">
                Valor Libro = Valor Original - ((Valor Original / Vida Útil) * Meses Transcurridos)
              </div>
              <p>
                La vida útil inicial es de <strong>36 meses</strong>. Al autorizarse una extensión excepcional, la vida útil contable se incrementa en <strong>12 meses</strong> para reducir el impacto de amortización inmediata y posibilitar la reasignación regulada.
              </p>
            </div>

            <div className="p-3 bg-violet-500/10 border border-violet-500/25 rounded-xl text-xs space-y-2 text-violet-300">
              <div className="font-bold flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4" />
                Escudo Legal Administrativo
              </div>
              <p className="text-[11px] leading-relaxed">
                Cada decisión genera una transición inmutable en la base de datos central. El registro de "Dado de Baja" transfiere el Responsable Administrativo a "Finanzas DAE (Baja Contable)", cerrando definitivamente la responsabilidad civil del colaborador.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
