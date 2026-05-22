"use client";

import React, { useState } from "react";
import { Asset } from "@/types";
import { 
  Wrench, 
  CheckSquare, 
  Play, 
  Send, 
  RotateCcw, 
  Activity, 
  AlertTriangle,
  Flame,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Trash2
} from "lucide-react";

interface TiViewProps {
  assets: Asset[];
  onTransitionAsset: (qr: string, status: string, emisor: string, receptor: string, motivo: string) => Promise<boolean>;
  onDiagnoseAsset: (qr: string, repairCost: number) => Promise<any>;
  isLoading: boolean;
}

export default function TiView({
  assets,
  onTransitionAsset,
  onDiagnoseAsset,
  isLoading
}: TiViewProps) {
  const [repairCosts, setRepairCosts] = useState<Record<string, string>>({});
  const [d2Result, setD2Result] = useState<Record<string, { type: "success" | "warning"; text: string }>>({});

  // Confirm receipt of asset sent by Bodega
  const handleConfirmReceipt = (qr: string) => {
    onTransitionAsset(
      qr,
      "En Configuración",
      "Soporte TI / Técnico",
      "Técnico TI: Configuración",
      "Confirmación de recepción física en laboratorio técnico. Inicio de protocolo de preparación."
    );
  };

  // Complete setup of asset
  const handleCompleteConfig = (qr: string) => {
    onTransitionAsset(
      qr,
      "Listo para Entrega",
      "Técnico TI: Configuración",
      "Soporte TI: Listo para Entrega",
      "Instalación de SO, parches de seguridad y perfiles de cargo completados con éxito."
    );
  };

  // Ready for pickup notification
  const handleNotifyPickup = (qr: string) => {
    onTransitionAsset(
      qr,
      "Pendiente de Recepción Formal",
      "Soporte TI: Listo para Entrega",
      "Colaborador",
      "Notificación enviada al colaborador para retiro del dispositivo físico y firma de acta digital."
    );
  };

  // Timeout return to Bodega
  const handleTimeoutReturn = (qr: string) => {
    onTransitionAsset(
      qr,
      "En Bodega",
      "Alerta de Monitoreo TI",
      "Encargado de Bodega",
      "Límite de tiempo formal excedido (Plazo expirado). Retorno automático de hardware a bodega de TI por seguridad."
    );
  };

  // Confirm return for formatting
  const handleConfirmReturnForFormatting = (qr: string, assignedTo: string | null) => {
    onTransitionAsset(
      qr,
      "En Validación Técnica",
      "Soporte TI",
      "Técnico TI: Validación e Higienización",
      `Activo retornado físicamente por cese de colaborador ${assignedTo || ''}. Iniciando formateo seguro e higienización física.`
    );
  };

  // Complete formatting
  const handleCompleteFormatting = (qr: string) => {
    onTransitionAsset(
      qr,
      "Disponible para Reasignación",
      "Técnico TI: Validación e Higienización",
      "Encargado de Bodega",
      "Formateo seguro (limpieza disco SSD) y desinfección física completada. Listo para asignación."
    );
  };

  // Return to bodega stock
  const handleReenterBodega = (qr: string) => {
    onTransitionAsset(
      qr,
      "En Bodega",
      "Encargado de Bodega",
      "Encargado de Bodega",
      "Reingreso definitivo de hardware higienizado al inventario de stock disponible."
    );
  };

  // Send to diagnosis
  const handleSendToDiagnosis = (qr: string) => {
    onTransitionAsset(
      qr,
      "En Diagnóstico",
      "Técnico TI: Servicio Técnico",
      "Técnico TI: Diagnóstico Financiero",
      "Ingreso a servicio técnico por reporte de falla física en terreno."
    );
  };

  // Handle D2 Diagnosis Submission
  const handleDiagnose = async (qr: string) => {
    const cost = parseInt(repairCosts[qr] || "0");
    if (isNaN(cost) || cost <= 0) {
      alert("Por favor, ingresa un costo de reparación válido mayor a 0.");
      return;
    }

    const res = await onDiagnoseAsset(qr, cost);
    if (res) {
      if (res.decision === "Pendiente de Decisión") {
        setD2Result(prev => ({
          ...prev,
          [qr]: {
            type: "warning",
            text: `Bloqueo D2 Excedido: ${res.reason}. El activo ha sido enviado al panel de Finanzas para dictaminar su baja.`
          }
        }));
      } else {
        setD2Result(prev => ({
          ...prev,
          [qr]: {
            type: "success",
            text: `Autorizado D2: ${res.reason}. Reparación autorizada debido a costos moderados y vida útil remanente óptima.`
          }
        }));
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400 border border-violet-500/20">
          <Wrench className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Consola de Soporte y Laboratorio Técnico - TI</h2>
          <p className="text-xs text-slate-400">Preparación, Control de Calidad, Gestión de Faltas (D2) e Higienización</p>
        </div>
      </div>

      {/* 1. Preparación de Equipos Recibidos y Notificación */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-6">
        <div>
          <h3 className="text-md font-bold text-white">Preparación de Nuevas Asignaciones</h3>
          <p className="text-xs text-slate-400 mt-0.5">Controla la recepción de bodega, configuración técnica y alertas de entrega de hardware.</p>
        </div>

        <div className="space-y-4">
          {assets.filter(a => [
            "En Tránsito (Bodega-TI)", 
            "En Configuración", 
            "Listo para Entrega", 
            "Pendiente de Recepción Formal"
          ].includes(a.status)).length === 0 ? (
            <div className="text-xs text-slate-500 italic border border-slate-800 border-dashed rounded-xl p-6 text-center">
              No hay activos en proceso de preparación en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.filter(a => [
                "En Tránsito (Bodega-TI)", 
                "En Configuración", 
                "Listo para Entrega", 
                "Pendiente de Recepción Formal"
              ].includes(a.status)).map(asset => (
                <div key={asset.qr_code} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">{asset.qr_code}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                        {asset.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-200">{asset.category} ({asset.specs.ram} RAM)</h4>
                    <p className="text-xs text-slate-400">Destinatario: <strong className="text-slate-300">{asset.assigned_to}</strong></p>
                    
                    {/* Legal accountability */}
                    <div className="text-[10.5px] bg-slate-950/80 p-2 rounded border border-slate-800/40 text-slate-500 space-y-1">
                      <div>Custodio: <strong className="text-slate-400">{asset.custodio_fisico}</strong></div>
                      <div>Resp. Legal: <strong className="text-slate-400">{asset.responsable_administrativo}</strong></div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-900">
                    {asset.status === "En Tránsito (Bodega-TI)" && (
                      <button
                        onClick={() => handleConfirmReceipt(asset.qr_code)}
                        className="w-full py-2 px-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs rounded-lg transition-all"
                      >
                        Confirmar Recepción Física
                      </button>
                    )}

                    {asset.status === "En Configuración" && (
                      <button
                        onClick={() => handleCompleteConfig(asset.qr_code)}
                        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-all"
                      >
                        Completar Configuración Técnica
                      </button>
                    )}

                    {asset.status === "Listo para Entrega" && (
                      <button
                        onClick={() => handleNotifyPickup(asset.qr_code)}
                        className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Notificar Retiro a Colaborador
                      </button>
                    )}

                    {asset.status === "Pendiente de Recepción Formal" && (
                      <div className="space-y-2">
                        <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-[10.5px] flex items-start gap-1.5 leading-relaxed">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500" />
                          <span><strong>Custodia TI Crítica:</strong> Esperando que el colaborador firme el acta digital. Riesgo de acumulación física en laboratorio.</span>
                        </div>
                        <button
                          onClick={() => handleTimeoutReturn(asset.qr_code)}
                          className="w-full py-2 px-3 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg transition-all"
                        >
                          Gatillar Retorno por Inactividad (Timeout)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Ciclo de Retorno y Validación Técnica (Decomisión) */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-6">
        <div>
          <h3 className="text-md font-bold text-white">Retornos, Formateo e Higienización</h3>
          <p className="text-xs text-slate-400 mt-0.5">Gestión de activos que entran en cese de funciones o retiro de colaboradores.</p>
        </div>

        <div className="space-y-4">
          {assets.filter(a => [
            "Pendiente de Devolución",
            "En Validación Técnica",
            "Disponible para Reasignación"
          ].includes(a.status)).length === 0 ? (
            <div className="text-xs text-slate-500 italic border border-slate-800 border-dashed rounded-xl p-6 text-center">
              No hay activos pendientes de devolución o validación actualmente.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.filter(a => [
                "Pendiente de Devolución",
                "En Validación Técnica",
                "Disponible para Reasignación"
              ].includes(a.status)).map(asset => (
                <div key={asset.qr_code} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">{asset.qr_code}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-md">
                        {asset.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-200">{asset.category}</h4>
                    <p className="text-xs text-slate-400">Último custodio: <strong className="text-slate-300">{asset.assigned_to}</strong></p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-900">
                    {asset.status === "Pendiente de Devolución" && (
                      <button
                        onClick={() => handleConfirmReturnForFormatting(asset.qr_code, asset.assigned_to)}
                        className="w-full py-2 px-3 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-xs rounded-lg transition-all"
                      >
                        Confirmar Recepción y Formatear
                      </button>
                    )}

                    {asset.status === "En Validación Técnica" && (
                      <button
                        onClick={() => handleCompleteFormatting(asset.qr_code)}
                        className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg transition-all"
                      >
                        Completar Formateo y Liberar
                      </button>
                    )}

                    {asset.status === "Disponible para Reasignación" && (
                      <button
                        onClick={() => handleReenterBodega(asset.qr_code)}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-all"
                      >
                        Reingresar Físicamente a Bodega (Stock)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Lógica D2: Diagnósticos y Decisiones de Costo/Obsolescencia */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-6">
        <div>
          <h3 className="text-md font-bold text-white">Compuerta D2: Diagnóstico y Criterio Financiero de Fallas</h3>
          <p className="text-xs text-slate-400 mt-0.5">Evalúa si un hardware dañado merece reparación o si debe declararse en obsolescencia/baja contable.</p>
        </div>

        {/* 3.1. Active assets that can be sent to repair */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase">Equipos en Terreno (Asignados)</h4>
          {assets.filter(a => a.status === "Asignado" || a.status === "Asignado (Extendido)").length === 0 ? (
            <p className="text-xs text-slate-500 italic pl-1">No hay equipos asignados en terreno que puedan fallar.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.filter(a => a.status === "Asignado" || a.status === "Asignado (Extendido)").map(asset => (
                <div key={asset.qr_code} className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-400 font-semibold">{asset.qr_code} - {asset.category}</div>
                    <div className="text-[11px] text-slate-500">Custodio: {asset.assigned_to} | Fallas previas: {asset.previous_failures_count}</div>
                  </div>
                  <button
                    onClick={() => handleSendToDiagnosis(asset.qr_code)}
                    className="py-1.5 px-3 bg-rose-950/60 border border-rose-800/40 text-rose-400 hover:bg-rose-900/60 text-xs font-semibold rounded-lg transition-all"
                  >
                    Reportar Falla Técnica
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3.2. Diagnosis Process & D2 Rules Evaluation */}
        <div className="space-y-4 pt-4 border-t border-slate-800/60">
          <h4 className="text-xs font-bold text-slate-400 uppercase">Diagnósticos Pendientes de Evaluación D2</h4>
          {assets.filter(a => a.status === "En Diagnóstico").length === 0 ? (
            <div className="text-xs text-slate-500 italic border border-slate-800 border-dashed rounded-xl p-4 text-center">
              No hay hardware bajo evaluación técnica actualmente.
            </div>
          ) : (
            <div className="space-y-4">
              {assets.filter(a => a.status === "En Diagnóstico").map(asset => (
                <div key={asset.qr_code} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h5 className="text-sm font-bold text-slate-200">{asset.category} ({asset.qr_code})</h5>
                      <div className="text-xs text-slate-400">Valor Equipo Nuevo de Reposición: <strong>${asset.new_equipment_price.toLocaleString("es-CL")} CLP</strong></div>
                      <div className="text-xs text-slate-400">Meses Remanentes de Vida Útil: <strong>{asset.remaining_months} meses</strong></div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                      En Diagnóstico
                    </span>
                  </div>

                  {/* Input Cost */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Costo de Reparación Estimado (CLP)</label>
                      <input
                        type="number"
                        placeholder="Ej: 450000"
                        value={repairCosts[asset.qr_code] || ""}
                        onChange={(e) => setRepairCosts(prev => ({ ...prev, [asset.qr_code]: e.target.value }))}
                        className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 focus:border-violet-500 text-slate-200 rounded-lg outline-none"
                      />
                    </div>
                    <button
                      onClick={() => handleDiagnose(asset.qr_code)}
                      disabled={isLoading}
                      className="py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-all mt-4"
                    >
                      Evaluar Compuerta D2
                    </button>
                  </div>

                  {/* Rule D2 output box */}
                  {d2Result[asset.qr_code] && (
                    <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                      d2Result[asset.qr_code].type === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>
                      <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${
                        d2Result[asset.qr_code].type === "success" ? "text-emerald-400" : "text-rose-400"
                      }`} />
                      <span>{d2Result[asset.qr_code].text}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
