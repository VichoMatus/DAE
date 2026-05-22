"use client";

import React, { useState } from "react";
import { Asset, HistoryLog } from "@/types";
import { 
  History, 
  Search, 
  Filter, 
  MapPin, 
  ShieldCheck, 
  Cpu, 
  AlertCircle,
  FileCheck2,
  Coins,
  Battery,
  AlertTriangle,
  Wrench,
  TrendingDown,
  LayoutDashboard,
  BarChart3
} from "lucide-react";
import AssetHistory from "./AssetHistory";

// --- Shadcn-like Card Component Primitives ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
const Card = ({ className, children, ...props }: CardProps) => (
  <div className={`rounded-2xl border border-slate-800 bg-slate-900/10 text-slate-200 shadow-xl backdrop-blur-md ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ className, children, ...props }: CardProps) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-sm font-bold leading-none tracking-tight text-white flex items-center gap-2 ${className}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-xs text-slate-400 mt-1 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ className, children, ...props }: CardProps) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

// --- Main Supervisor/Audit Component ---
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
  const [activeTab, setActiveTab] = useState<"general" | "metrics">("general");

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

  // Stats calculations
  const totalAssetsCount = assets.length;
  const activeAssets = assets.filter(a => a.status !== "Dado de Baja");
  
  // Financial portfolio values
  const totalOriginalValue = activeAssets.reduce((sum, a) => sum + a.original_value, 0);
  const totalBookValue = activeAssets.reduce((sum, a) => sum + a.book_value, 0);
  const totalDepreciatedValue = totalOriginalValue - totalBookValue;
  const depreciatedPct = totalOriginalValue > 0 ? Math.round((totalDepreciatedValue / totalOriginalValue) * 100) : 0;
  
  // Status breakdown
  const inBodegaCount = assets.filter(a => ["En Bodega", "Disponible para Reasignación"].includes(a.status)).length;
  const assignedCount = assets.filter(a => ["Asignado", "Asignado (Extendido)"].includes(a.status)).length;
  const inTransitCount = assets.filter(a => a.status.includes("Tránsito")).length;
  const inTechSupportCount = assets.filter(a => ["En Configuración", "Listo para Entrega", "Pendiente de Recepción Formal", "En Diagnóstico", "Pendiente de Decisión", "En Validación Técnica"].includes(a.status)).length;
  const incidentsCount = assets.filter(a => a.status === "Incidente Externo").length;
  const decommissionedCount = assets.filter(a => a.status === "Dado de Baja").length;

  // Health stats
  const activeWithBattery = activeAssets.filter(a => a.battery_wear_pct !== undefined);
  const avgBatteryWear = activeWithBattery.length > 0 
    ? Math.round(activeWithBattery.reduce((sum, a) => sum + a.battery_wear_pct, 0) / activeWithBattery.length)
    : 0;
  const avgBatteryHealth = 100 - avgBatteryWear;
  const criticalBatteryCount = activeAssets.filter(a => a.battery_wear_pct >= 30).length;
  const totalFailures = activeAssets.reduce((sum, a) => sum + a.previous_failures_count, 0);

  // Filters logic for the list tab
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Consola de Auditoría y Trazabilidad Global</h2>
            <p className="text-xs text-slate-400">Inspección de Custodias Activas, Búsqueda de Activos e Historial de Transiciones Inmutables</p>
          </div>
        </div>

        {/* --- Shadcn Tabs Control --- */}
        <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 shadow-inner">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === "general" 
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Trazabilidad General
          </button>
          <button
            onClick={() => setActiveTab("metrics")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              activeTab === "metrics" 
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/20" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Métricas e Indicadores
          </button>
        </div>
      </div>

      {/* Overview stats cards (Always visible for fast reference) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl shadow-lg">
          <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Activos Totales</span>
          <strong className="text-2xl font-extrabold text-slate-200 block mt-1">{totalAssetsCount}</strong>
        </div>
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl shadow-lg">
          <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Asignados Activos</span>
          <strong className="text-2xl font-extrabold text-indigo-400 block mt-1">{assignedCount}</strong>
        </div>
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl shadow-lg">
          <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Bajas Contables</span>
          <strong className="text-2xl font-extrabold text-slate-500 block mt-1">{decommissionedCount}</strong>
        </div>
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl shadow-lg">
          <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Incidentes Activos</span>
          <strong className="text-2xl font-extrabold text-rose-400 block mt-1">{incidentsCount}</strong>
        </div>
      </div>

      {/* --- Main Content Section split --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Columns (Tabs Content) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* TAB 1: GENERAL TRACEABILITY TABLE */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por QR, Categoría o Colaborador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs py-2 pl-9 pr-4 bg-slate-950 border border-slate-800 focus:border-violet-500 text-slate-200 rounded-lg outline-none transition-all"
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

              <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
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
                              selectedAssetQr === asset.qr_code ? "bg-violet-950/15" : ""
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
                                className="py-1 px-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all font-semibold"
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
          )}

          {/* TAB 2: SHADCN-STYLE ANALYTICS PANEL */}
          {activeTab === "metrics" && (
            <div className="space-y-6">
              
              {/* Financial Health & Portfolio Value Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-emerald-400">
                    <Coins className="h-4 w-4" />
                    Valoración y Depreciación Financiera Activa
                  </CardTitle>
                  <CardDescription>
                    Resumen contable del valor libro restante frente a la inversión inicial de los activos activos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Valor Adquisición Total</span>
                      <div className="text-xl font-bold text-slate-100">${totalOriginalValue.toLocaleString("es-CL")} CLP</div>
                    </div>
                    <div className="space-y-1 border-y md:border-y-0 md:border-x border-slate-800/80 py-4 md:py-0 md:px-6">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Valor Libro Neto Actual</span>
                      <div className="text-xl font-bold text-emerald-400">${totalBookValue.toLocaleString("es-CL")} CLP</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Depreciación Acumulada</span>
                      <div className="text-xl font-bold text-rose-400 flex items-center gap-1">
                        <TrendingDown className="h-4 w-4" />
                        {depreciatedPct}%
                      </div>
                    </div>
                  </div>

                  {/* Custom Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Valor Libro Remanente ({100 - depreciatedPct}%)</span>
                      <span>Depreciado ({depreciatedPct}%)</span>
                    </div>
                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/50">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500" 
                        style={{ width: `${100 - depreciatedPct}%` }}
                      />
                      <div 
                        className="bg-slate-800 h-full transition-all duration-500" 
                        style={{ width: `${depreciatedPct}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hardware Health Metrics (Battery Wear and Failures) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-violet-400">
                      <Battery className="h-4 w-4" />
                      Salud Física y Degradación de Baterías
                    </CardTitle>
                    <CardDescription>
                      Estado promedio de desgaste de celdas de carga y alerta de reemplazo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center space-y-4 py-2">
                    
                    {/* SVG Circular Donut Chart */}
                    <div className="relative h-28 w-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-800"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-violet-500 transition-all duration-500"
                          strokeWidth="3.5"
                          strokeDasharray={`${avgBatteryHealth}, 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-lg font-extrabold text-white">{avgBatteryHealth}%</span>
                        <span className="text-[8px] text-slate-400 uppercase tracking-widest">Salud Prom.</span>
                      </div>
                    </div>

                    <div className="w-full text-xs space-y-2 border-t border-slate-800/60 pt-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Desgaste Promedio de Carga:</span>
                        <span className="text-violet-400 font-bold">{avgBatteryWear}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Equipos Críticos (Desgaste $\ge$ 30% - Compuerta D3):</span>
                        <span className={`font-bold ${criticalBatteryCount > 0 ? "text-amber-400" : "text-slate-300"}`}>
                          {criticalBatteryCount} {criticalBatteryCount === 1 ? "activo" : "activos"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-rose-400">
                      <Wrench className="h-4 w-4" />
                      Historial e Incidencias Técnicas
                    </CardTitle>
                    <CardDescription>
                      Consolidado de fallas de hardware en terreno y alertas asociadas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Fallas Históricas Totales</span>
                        <strong className="text-2xl font-extrabold text-slate-200">{totalFailures}</strong>
                      </div>
                      <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="text-xs space-y-3">
                      <h5 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Distribución de Custodias Críticas</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-900">
                          <span className="text-slate-400">En Tránsito (Sin Custodio Físico Fijo)</span>
                          <span className="font-bold text-amber-400">{inTransitCount}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-900">
                          <span className="text-slate-400">En Trámite de Configuración / Soporte</span>
                          <span className="font-bold text-violet-400">{inTechSupportCount}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Status breakdown progress visualizer */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Activos por Estados del Proceso</CardTitle>
                  <CardDescription>
                    Monitoreo de flujo físico y administrativo de todos los activos fijos ingresados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/80">
                    <div className="bg-emerald-500 h-full" style={{ width: `${totalAssetsCount > 0 ? (inBodegaCount / totalAssetsCount) * 100 : 0}%` }} title="Bodega" />
                    <div className="bg-indigo-500 h-full" style={{ width: `${totalAssetsCount > 0 ? (assignedCount / totalAssetsCount) * 100 : 0}%` }} title="Asignado" />
                    <div className="bg-violet-500 h-full" style={{ width: `${totalAssetsCount > 0 ? (inTechSupportCount / totalAssetsCount) * 100 : 0}%` }} title="Configuración / Soporte" />
                    <div className="bg-amber-500 h-full" style={{ width: `${totalAssetsCount > 0 ? (inTransitCount / totalAssetsCount) * 100 : 0}%` }} title="Tránsito" />
                    <div className="bg-red-600 h-full" style={{ width: `${totalAssetsCount > 0 ? (incidentsCount / totalAssetsCount) * 100 : 0}%` }} title="Incidente" />
                    <div className="bg-slate-700 h-full" style={{ width: `${totalAssetsCount > 0 ? (decommissionedCount / totalAssetsCount) * 100 : 0}%` }} title="Baja" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs pt-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-slate-400">Bodega / Stock: <strong>{inBodegaCount}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shrink-0" />
                      <span className="text-slate-400">Asignados: <strong>{assignedCount}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-violet-500 shrink-0" />
                      <span className="text-slate-400">Soporte/Config: <strong>{inTechSupportCount}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-slate-400">Tránsito: <strong>{inTransitCount}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-600 shrink-0" />
                      <span className="text-slate-400">Incidentes: <strong>{incidentsCount}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-700 shrink-0" />
                      <span className="text-slate-400">Bajas: <strong>{decommissionedCount}</strong></span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

        </div>

        {/* Right Column: Asset Details & Timeline History */}
        <div>
          {selectedAsset ? (
            <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-6 sticky top-6 max-h-[85vh] overflow-y-auto shadow-2xl">
              
              {/* Asset Title Block */}
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-400">{selectedAsset.qr_code}</span>
                <h3 className="text-base font-extrabold text-white mt-1.5">{selectedAsset.category}</h3>
                <span className={`inline-block mt-2 px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${getStatusColor(selectedAsset.status)}`}>
                  {selectedAsset.status}
                </span>
              </div>

              {/* Legal Custody Block */}
              <div className="p-4 bg-slate-950 border border-slate-855 rounded-xl space-y-3 shadow-inner">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <FileCheck2 className="h-3.5 w-3.5 text-violet-400" />
                  Estado de Responsabilidad
                </h4>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Custodio Físico actual</span>
                      <strong className="text-slate-200 font-semibold">{selectedAsset.custodio_fisico}</strong>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 border-t border-slate-900 pt-2">
                    <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Responsable Administrativo (Legal)</span>
                      <strong className="text-slate-200 font-semibold">{selectedAsset.responsable_administrativo}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hardware specifications */}
              <div className="space-y-2 text-xs">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-semibold">Características Físicas</h4>
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">RAM</span>
                    <strong className="text-slate-300 font-medium">{selectedAsset.specs.ram}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Procesador</span>
                    <strong className="text-slate-300 font-medium block truncate">{selectedAsset.specs.processor}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">SSD</span>
                    <strong className="text-slate-300 font-medium">{selectedAsset.specs.storage}</strong>
                  </div>
                </div>
              </div>

              {/* Lifecycle Info */}
              <div className="space-y-2.5 text-xs border-t border-slate-800/60 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-semibold">Monitoreo de Vida Útil</h4>
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
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-semibold">Historial de Transiciones Inmutables</h4>
                <div className="overflow-y-auto max-h-[250px] pr-1">
                  <AssetHistory logs={logs} assetQr={selectedAsset.qr_code} />
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card p-8 rounded-2xl border border-slate-800/60 bg-slate-900/10 text-center text-slate-500 text-xs italic py-16 sticky top-6 shadow-2xl">
              Selecciona un activo tecnológico de la tabla para auditar sus detalles de custodia e historial de transiciones inmutables.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
