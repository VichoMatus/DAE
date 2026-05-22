"use client";

import React, { useState } from "react";
import { Asset, HistoryLog } from "@/types";
import { 
  History, 
  Search, 
  Filter, 
  Layers, 
  MapPin, 
  ShieldCheck, 
  Cpu, 
  Calendar,
  AlertCircle,
  FileCheck2
} from "lucide-react";
import AssetHistory from "./AssetHistory";

interface SupervisorViewProps {
  assets: Asset[];
  logs: HistoryLog[];
  isLoading: boolean;
}

export default function SupervisorView({
  assets,
  logs,
  isLoading
}: SupervisorViewProps) {
  const [selectedAssetQr, setSelectedAssetQr] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

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
      case "Incidente Externo": return "bg-red-500/15 text-red-400 border-red-500/30 font-bold";
      case "Dado de Baja": return "bg-slate-700/20 text-slate-400 border-slate-700/30";
      default: return "bg-slate-800 text-slate-400 border-transparent";
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      asset.qr_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.assigned_to && asset.assigned_to.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesFilter = statusFilter === "Todos" || asset.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const statuses = ["Todos", "En Bodega", "En Configuración", "Listo para Entrega", "Asignado", "Asignado (Extendido)", "En Diagnóstico", "Pendiente de Decisión", "Incidente Externo", "Dado de Baja"];

  const selectedAsset = assets.find(a => a.qr_code === selectedAssetQr);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
          <History className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Consola de Auditoría y Trazabilidad Global</h2>
          <p className="text-xs text-slate-400">Inspección de Custodias Activas, Búsqueda de Activos e Historial de Transiciones Inmutables</p>
        </div>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Activos Totales</span>
          <strong className="text-xl font-bold text-slate-200">{assets.length}</strong>
        </div>
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Asignados Activos</span>
          <strong className="text-xl font-bold text-indigo-400">
            {assets.filter(a => a.status === "Asignado" || a.status === "Asignado (Extendido)").length}
          </strong>
        </div>
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Bajas Contables</span>
          <strong className="text-xl font-bold text-slate-500">
            {assets.filter(a => a.status === "Dado de Baja").length}
          </strong>
        </div>
        <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl">
          <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Incidentes Activos</span>
          <strong className="text-xl font-bold text-rose-400">
            {assets.filter(a => a.status === "Incidente Externo").length}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Asset Table Search */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por QR, Categoría o Colaborador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs py-2 pl-9 pr-4 bg-slate-950 border border-slate-800 focus:border-violet-500 text-slate-200 rounded-lg outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-slate-500 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-44 text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg outline-none"
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Código QR</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Valor Libro</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 px-4 text-center text-slate-500 italic">
                        No se encontraron activos bajo los criterios seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => (
                      <tr 
                        key={asset.qr_code} 
                        className={`hover:bg-slate-900/30 transition-colors cursor-pointer ${
                          selectedAssetQr === asset.qr_code ? "bg-violet-950/10" : ""
                        }`}
                        onClick={() => setSelectedAssetQr(asset.qr_code)}
                      >
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">{asset.qr_code}</td>
                        <td className="py-3.5 px-4 font-bold text-white">{asset.category}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 border rounded text-[10px] font-bold ${getStatusColor(asset.status)}`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">${asset.book_value.toLocaleString("es-CL")}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAssetQr(asset.qr_code);
                            }}
                            className="py-1 px-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded text-slate-400 hover:text-slate-200 transition-all font-semibold"
                          >
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Asset Details & Timeline History */}
        <div>
          {selectedAsset ? (
            <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-6 sticky top-6 max-h-[85vh] overflow-y-auto">
              
              {/* Asset Title Block */}
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-400">{selectedAsset.qr_code}</span>
                <h3 className="text-base font-extrabold text-white mt-1.5">{selectedAsset.category}</h3>
                <span className={`inline-block mt-2 px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${getStatusColor(selectedAsset.status)}`}>
                  {selectedAsset.status}
                </span>
              </div>

              {/* Legal Custody Block */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <FileCheck2 className="h-3.5 w-3.5 text-violet-400" />
                  Estado de Responsabilidad
                </h4>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Custodio Físico actual</span>
                      <strong className="text-slate-200 font-semibold">{selectedAsset.custodio_fisico}</strong>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 border-t border-slate-900 pt-2">
                    <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Responsable Administrativo (Legal)</span>
                      <strong className="text-slate-200 font-semibold">{selectedAsset.responsable_administrativo}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hardware specifications */}
              <div className="space-y-2 text-xs">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Características Físicas</h4>
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">RAM</span>
                    <strong className="text-slate-300 font-medium">{selectedAsset.specs.ram}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Procesador</span>
                    <strong className="text-slate-300 font-medium block truncate">{selectedAsset.specs.processor}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">SSD</span>
                    <strong className="text-slate-300 font-medium">{selectedAsset.specs.storage}</strong>
                  </div>
                </div>
              </div>

              {/* Lifecycle Info */}
              <div className="space-y-2.5 text-xs border-t border-slate-800/60 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monitoreo de Vida Útil</h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fecha de Adquisición:</span>
                    <span className="text-slate-300">{selectedAsset.purchase_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Garantía del Fabricante:</span>
                    <span className="text-slate-300">{selectedAsset.warranty_end_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Desgaste Batería:</span>
                    <span className="text-slate-300 font-semibold">{selectedAsset.battery_wear_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fallas registradas:</span>
                    <span className="text-slate-300">{selectedAsset.previous_failures_count}</span>
                  </div>
                </div>
              </div>

              {/* Timeline History log */}
              <div className="space-y-4 border-t border-slate-800/60 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial de Transiciones Inmutables</h4>
                <div className="overflow-y-auto max-h-[300px] pr-1">
                  <AssetHistory logs={logs} assetQr={selectedAsset.qr_code} />
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card p-8 rounded-2xl border border-slate-800/60 bg-slate-900/10 text-center text-slate-500 text-xs italic py-16 sticky top-6">
              Selecciona un activo tecnológico de la tabla para auditar sus detalles de custodia e historial de transiciones inmutables.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
