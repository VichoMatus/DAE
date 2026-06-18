"use client";

import React, { useState } from "react";
import { AllocationRequest, Asset } from "@/types";
import { Package, Truck, AlertTriangle, CheckCircle2, BadgeAlert, Laptop, ShieldCheck, ChevronDown, ChevronUp, PlusCircle } from "lucide-react";

interface BodegaViewProps {
  assets: Asset[];
  requests: AllocationRequest[];
  onCreateAsset: (data: any) => Promise<{ ok: boolean; status: number; error?: string; asset?: Asset }>;
  onTransitionAsset: (qr: string, status: string, emisor: string, receptor: string, motivo: string, requestId?: string) => Promise<boolean>;
  errorMsg: string | null;
  setErrorMsg: (msg: string | null) => void;
  isLoading: boolean;
}

export default function BodegaView({
  assets,
  requests,
  onCreateAsset,
  onTransitionAsset,
  errorMsg,
  setErrorMsg,
  isLoading
}: BodegaViewProps) {
  const [selectedReqId, setSelectedReqId] = useState<string>("");
  const [selectedAssetQr, setSelectedAssetQr] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createForm, setCreateForm] = useState({
    qr_code: "",
    category: "MacBook Pro M3",
    ram: "8GB",
    processor: "",
    storage: "256GB SSD",
    original_value: "",
    new_equipment_price: "",
    purchase_date: "",
    lifespan_months: "36",
    warranty_end_date: "",
  });

  const pendingRequests = requests.filter(r => r.status === "Pendiente");
  const stockAssets = assets.filter(a => a.status === "En Bodega" || a.status === "Disponible para Reasignación");

  const currentDateStr = React.useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const isFormInvalid = React.useMemo(() => {
    const originalValueNum = Number(createForm.original_value);
    const newEquipmentPriceNum = Number(createForm.new_equipment_price);
    const lifespanMonthsNum = Number(createForm.lifespan_months);

    return (
      originalValueNum <= 0 ||
      newEquipmentPriceNum <= 0 ||
      lifespanMonthsNum <= 0 ||
      isNaN(originalValueNum) ||
      isNaN(newEquipmentPriceNum) ||
      isNaN(lifespanMonthsNum) ||
      !createForm.qr_code.trim() ||
      !createForm.purchase_date ||
      !createForm.warranty_end_date ||
      createForm.purchase_date > currentDateStr
    );
  }, [createForm, currentDateStr]);

  const handleCreateAsset = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateMsg(null);

    const payload = {
      qr_code: createForm.qr_code,
      category: createForm.category,
      specs: {
        ram: createForm.ram,
        processor: createForm.processor,
        storage: createForm.storage,
      },
      original_value: Number(createForm.original_value),
      purchase_date: createForm.purchase_date,
      new_equipment_price: Number(createForm.new_equipment_price),
      lifespan_months: Number(createForm.lifespan_months),
      warranty_end_date: createForm.warranty_end_date,
    };

    const res = await onCreateAsset(payload);
    if (res.ok) {
      setCreateMsg({ type: "success", text: `Activo ${createForm.qr_code} registrado exitosamente en bodega.` });
      setCreateForm({
        qr_code: "",
        category: "MacBook Pro M3",
        ram: "8GB",
        processor: "",
        storage: "256GB SSD",
        original_value: "",
        new_equipment_price: "",
        purchase_date: "",
        lifespan_months: "36",
        warranty_end_date: "",
      });
      setShowCreateForm(false);
    } else if (res.status === 409) {
      setCreateMsg({ type: "error", text: "El código QR ya existe en el sistema." });
    } else {
      setCreateMsg({ type: "error", text: "Error al registrar el activo. Verifica los datos." });
    }
  };

  const handleDispatch = async () => {
    if (!selectedReqId || !selectedAssetQr) {
      setErrorMsg("Debes seleccionar una solicitud pendiente y un activo disponible en stock.");
      return;
    }
    setErrorMsg(null);

    const req = requests.find(r => r.id === selectedReqId);
    const asset = assets.find(a => a.qr_code === selectedAssetQr);
    if (!req || !asset) return;

    const success = await onTransitionAsset(
      selectedAssetQr,
      "En Tránsito (Bodega-TI)",
      "Encargado de Bodega",
      "Soporte TI / Técnico",
      `Despacho de stock físico: Asignación a solicitud ${selectedReqId} para ${req.collaborator} (${req.collaborator_profile})`,
      selectedReqId
    );

    if (success) {
      setSelectedReqId("");
      setSelectedAssetQr("");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Dashboard de Inventario - Bodega</h2>
          <p className="text-xs text-slate-400">Control de Existencias, Conciliación de Entrada/Salida y Compuerta D1</p>
        </div>
      </div>

      {/* New asset registration */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-md font-bold text-white">Registro Manual de Nuevo Activo</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ingresa hardware nuevo que llega desde compras y deja trazabilidad inicial automática.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm((value) => !value)}
            className="flex items-center gap-2 py-2 px-3 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-all"
          >
            {showCreateForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Registrar Nuevo Activo
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateAsset} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Código QR</label>
                <input
                  type="text"
                  value={createForm.qr_code}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, qr_code: e.target.value }))}
                  placeholder="Ej: UCT-TI-2026-099"
                  className="w-full text-xs py-2.5 px-3 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Categoría</label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full text-xs py-2.5 px-3 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-emerald-500"
                >
                  {['MacBook Pro M3', 'MacBook Pro M1', 'Dell Latitude 5440', 'ThinkPad L14', 'Workstation i9'].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">RAM</label>
                <select
                  value={createForm.ram}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, ram: e.target.value }))}
                  className="w-full text-xs py-2.5 px-3 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-emerald-500"
                >
                  {['8GB', '16GB', '18GB', '32GB'].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Procesador</label>
                <input
                  type="text"
                  value={createForm.processor}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, processor: e.target.value }))}
                  placeholder="Ej: Intel Core i5"
                  className="w-full text-xs py-2.5 px-3 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Almacenamiento</label>
                <select
                  value={createForm.storage}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, storage: e.target.value }))}
                  className="w-full text-xs py-2.5 px-3 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-emerald-500"
                >
                  {['256GB SSD', '512GB SSD', '1TB SSD'].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Valor Original (CLP)</label>
                <input
                  type="number"
                  value={createForm.original_value}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, original_value: e.target.value }))}
                  placeholder="Ej: 1200000"
                  className="w-full text-xs py-2.5 px-3 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Precio Equipo Nuevo (CLP)</label>
                <input
                  type="number"
                  value={createForm.new_equipment_price}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, new_equipment_price: e.target.value }))}
                  placeholder="Ej: 1400000"
                  className="w-full text-xs py-2.5 px-3 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Fecha de Compra</label>
                <input
                  type="date"
                  value={createForm.purchase_date}
                  max={currentDateStr}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
                  className="w-full text-xs py-2.5 px-3 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Meses de Vida Útil</label>
                <input
                  type="number"
                  value={createForm.lifespan_months}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, lifespan_months: e.target.value }))}
                  className="w-full text-xs py-2.5 px-3 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Fecha Vencimiento Garantía</label>
                <input
                  type="date"
                  value={createForm.warranty_end_date}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, warranty_end_date: e.target.value }))}
                  className="w-full text-xs py-2.5 px-3 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isFormInvalid}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Registrar en Sistema
            </button>
          </form>
        )}

        {createMsg && (
          <div className={`p-3 rounded-lg border text-xs ${createMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
            {createMsg.text}
          </div>
        )}
      </div>

      {/* Grid of Stock Inventory */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Activos en Existencia (Stock)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assets.map((asset) => {
            const isAvailable = asset.status === "En Bodega" || asset.status === "Disponible para Reasignación";
            return (
              <div 
                key={asset.qr_code} 
                className={`glass-card p-5 rounded-2xl border ${
                  isAvailable ? "border-slate-800" : "border-slate-900 opacity-60"
                } bg-slate-900/10 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-slate-400">
                        {asset.qr_code}
                      </span>
                      <h4 className="text-base font-extrabold text-white mt-1.5">{asset.category}</h4>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 border rounded-full ${
                      isAvailable 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" 
                        : "bg-slate-800 text-slate-400 border-transparent"
                    }`}>
                      {asset.status}
                    </span>
                  </div>

                  {/* Specs Matrix */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40 text-[11px] mb-4">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">RAM</span>
                      <span className="font-semibold text-slate-300">{asset.specs.ram}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Procesador</span>
                      <span className="font-semibold text-slate-300 truncate block">{asset.specs.processor}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Capacidad</span>
                      <span className="font-semibold text-slate-300">{asset.specs.storage}</span>
                    </div>
                  </div>

                  {/* Pricing and depreciation */}
                  <div className="space-y-1.5 text-xs border-b border-slate-800/60 pb-3 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Valor Libro (Depreciación Lineal):</span>
                      <strong className="text-emerald-400 font-mono">${asset.book_value?.toLocaleString("es-CL")} CLP</strong>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Valor Original:</span>
                      <span>${asset.original_value?.toLocaleString("es-CL")} CLP</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Meses restantes vida útil:</span>
                      <span>{asset.remaining_months} meses</span>
                    </div>
                  </div>
                </div>

                {/* Custody labels */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-orange-400" />
                    <span>Físico: <strong>{asset.custodio_fisico}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span>Administrativo: <strong>{asset.responsable_administrativo}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* D1 Gateway Decision Module */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/10">
        <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
          Compuerta D1: Control de Stock y Compatibilidad Técnica
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Asigna y despacha un equipo a TI basándote en la solicitud de asignación. El backend verificará si las especificaciones del activo coinciden con el perfil exigido por el cargo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              1. Seleccionar Solicitud
            </label>
            <select
              value={selectedReqId}
              onChange={(e) => setSelectedReqId(e.target.value)}
              className="w-full text-xs py-2.5 px-3 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-violet-500"
            >
              <option value="">-- Solicitudes Pendientes --</option>
              {pendingRequests.map(r => (
                <option key={r.id} value={r.id}>
                  [{r.id}] {r.collaborator} - {r.category_requested} ({r.collaborator_profile})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
              2. Seleccionar Activo en Stock
            </label>
            <select
              value={selectedAssetQr}
              onChange={(e) => setSelectedAssetQr(e.target.value)}
              className="w-full text-xs py-2.5 px-3 bg-slate-950/60 border border-slate-800 text-slate-200 rounded-lg outline-none focus:border-violet-500"
            >
              <option value="">-- Activos Disponibles --</option>
              {stockAssets.map(a => (
                <option key={a.qr_code} value={a.qr_code}>
                  [{a.qr_code}] {a.category} ({a.specs.ram} RAM) - ${a.book_value.toLocaleString("es-CL")} CLP
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={handleDispatch}
              disabled={isLoading || !selectedReqId || !selectedAssetQr}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all"
            >
              <Truck className="h-4 w-4" />
              Despachar a TI (En Tránsito)
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2.5 animate-bounce">
            <BadgeAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Incompatibilidad / Error de Regla D1:</strong>
              <span className="mt-0.5 block">{errorMsg}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
