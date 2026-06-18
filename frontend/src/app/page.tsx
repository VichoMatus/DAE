"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Asset, AllocationRequest, HistoryLog } from "@/types";
import RoleSidebar from "@/components/RoleSidebar";
import JefeAreaView from "@/components/JefeAreaView";
import BodegaView from "@/components/BodegaView";
import TiView from "@/components/TiView";
import ColaboradorView from "@/components/ColaboradorView";
import FinanzasView from "@/components/FinanzasView";
import SupervisorView from "@/components/SupervisorView";
import { Activity, ShieldAlert, BadgeAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const API_BASE = "/api";

export default function Home() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<AllocationRequest[]>([]);
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Fetch all state data from the backend
  const fetchData = useCallback(async () => {
    try {
      const [assetsRes, requestsRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/assets`, { credentials: "include" }),
        fetch(`${API_BASE}/requests`, { credentials: "include" }),
        fetch(`${API_BASE}/history`, { credentials: "include" })
      ]);
      
      if (assetsRes.ok && requestsRes.ok && logsRes.ok) {
        const assetsData = await assetsRes.json();
        const requestsData = await requestsRes.json();
        const logsData = await logsRes.json();
        setAssets(assetsData);
        setRequests(requestsData);
        setLogs(logsData);
      }
    } catch (e) {
      console.error("Error fetching data from API:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [fetchData, user]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/login");
    }
  }, [isAuthLoading, router, user]);

  // Reset database to initial state
  const handleReset = async () => {
    setIsResetting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/reset`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error("Error resetting DB:", e);
    } finally {
      setIsResetting(false);
    }
  };

  // Submit allocation request
  const handleCreateRequest = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await fetchData();
        return true;
      }
    } catch (e) {
      console.error("Error creating request:", e);
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  // Register new asset from bodega
  const handleCreateAsset = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (res.ok) {
        await fetchData();
        return { ok: true, status: res.status, asset: resData };
      }

      return { ok: false, status: res.status, error: resData.error };
    } catch (e) {
      console.error("Error creating asset:", e);
      return { ok: false, status: 500 };
    } finally {
      setIsLoading(false);
    }
  };

  // Perform transitions
  const handleTransitionAsset = async (
    qr: string,
    status: string,
    emisor: string,
    receptor: string,
    motivo: string,
    requestId?: string
  ) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/assets/${qr}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, emisor, receptor, motivo, request_id: requestId })
      });
      
      const resData = await res.json();
      if (res.ok) {
        await fetchData();
        return true;
      } else {
        setErrorMsg(resData.error || "Error al procesar la transición");
        return false;
      }
    } catch (e) {
      console.error("Error performing transition:", e);
      setErrorMsg("Error de red: No se pudo establecer conexión con el backend.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Evaluate repair D2
  const handleDiagnoseAsset = async (qr: string, repairCost: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/assets/${qr}/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ repair_cost: repairCost, emisor: "Técnico TI" })
      });
      
      const resData = await res.json();
      if (res.ok) {
        await fetchData();
        return { ok: true, data: resData };
      } else {
        const errMsg = resData.error || "Error al registrar el diagnóstico del activo.";
        setErrorMsg(errMsg);
        return { ok: false, error: errMsg };
      }
    } catch (e) {
      console.error("Error diagnosing asset:", e);
      setErrorMsg("Error de red: No se pudo conectar con el servidor.");
      return { ok: false, error: "Error de red: No se pudo conectar con el servidor." };
    } finally {
      setIsLoading(false);
    }
  };

  // Finance Decision D3 (Baja / Extension)
  const handleFinanceDecision = async (
    qr: string,
    action: "baja" | "extension",
    justificacion_contable?: string,
    motivo?: string
  ) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/assets/${qr}/finance-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, justificacion_contable, motivo, emisor: "Finanzas DAE" })
      });
      const resData = await res.json();
      if (res.ok) {
        await fetchData();
        return true;
      } else {
        setErrorMsg(resData.error || "Error al procesar la decisión financiera");
        return false;
      }
    } catch (e) {
      console.error("Error in finance decision:", e);
      setErrorMsg("Error de red: No se pudo conectar con el servidor.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Report external incident
  const handleReportIncident = async (qr: string, policeReportNum: string, description: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/assets/${qr}/incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ police_report_num: policeReportNum, description, emisor: "Colaborador" })
      });
      const resData = await res.json();
      if (res.ok) {
        await fetchData();
        return true;
      } else {
        setErrorMsg(resData.error || "Error al registrar el incidente");
        return false;
      }
    } catch (e) {
      console.error("Error reporting incident:", e);
      setErrorMsg("Error de red: No se pudo conectar con el servidor.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar navigation */}
      <RoleSidebar onReset={handleReset} isResetting={isResetting} />

      {/* Main container */}
      <main className="flex-1 ml-80 min-h-screen p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-950/20 via-slate-950 to-slate-950">
        
        {/* Top Navbar */}
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              SISTEMA DE TRAZABILIDAD DE HARDWARE
            </h1>
            <p className="text-xs text-slate-500 font-medium">Control Inmutable de Custodias, Responsabilidad Civil y Auditoría</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Servidor Flask: Conectado</span>
            </div>
            
            <div className="text-xs text-slate-500 font-semibold px-2.5 py-1 bg-violet-600/15 border border-violet-500/20 rounded text-violet-400">
              Rol Activo: {user?.role ?? "-"}
            </div>
          </div>
        </header>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-950/25 text-rose-200 flex items-start gap-3 animate-fade-in shadow-lg shadow-rose-950/10">
            <ShieldAlert className="h-5 w-5 text-rose-400 mt-0.5 shrink-0 animate-bounce" />
            <div className="flex-1 text-xs">
              <strong className="font-semibold block mb-0.5 text-rose-300">Operación Rechazada</strong>
              {errorMsg}
            </div>
            <button 
              onClick={() => setErrorMsg(null)}
              className="text-rose-400 hover:text-rose-300 text-xs font-bold px-2 py-1 hover:bg-rose-500/10 rounded transition-all"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Dynamic View Selector */}
        <div className="transition-all duration-300">
          {(isAuthLoading || (isLoading && assets.length === 0)) ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Activity className="h-10 w-10 text-violet-400 animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Estableciendo conexión y cargando datos...</p>
            </div>
          ) : (
            <>
              {user?.role === "jefe_area" && (
                <JefeAreaView
                  assets={assets}
                  requests={requests}
                  onCreateRequest={handleCreateRequest}
                  onTransitionAsset={handleTransitionAsset}
                  isLoading={isLoading}
                />
              )}

              {user?.role === "bodega" && (
                <BodegaView
                  assets={assets}
                  requests={requests}
                  onCreateAsset={handleCreateAsset}
                  onTransitionAsset={handleTransitionAsset}
                  errorMsg={errorMsg}
                  setErrorMsg={setErrorMsg}
                  isLoading={isLoading}
                />
              )}

              {user?.role === "ti" && (
                <TiView
                  assets={assets}
                  onTransitionAsset={handleTransitionAsset}
                  onDiagnoseAsset={handleDiagnoseAsset}
                  isLoading={isLoading}
                />
              )}

              {user?.role === "colaborador" && (
                <ColaboradorView
                  assets={assets}
                  onTransitionAsset={handleTransitionAsset}
                  onReportIncident={handleReportIncident}
                  isLoading={isLoading}
                />
              )}

              {user?.role === "finanzas" && (
                <FinanzasView
                  assets={assets}
                  logs={logs}
                  onFinanceDecision={handleFinanceDecision}
                  isLoading={isLoading}
                />
              )}

              {user?.role === "auditor" && (
                <SupervisorView
                  assets={assets}
                  logs={logs}
                  isLoading={isLoading}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
