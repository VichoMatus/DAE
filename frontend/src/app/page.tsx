"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Asset, AllocationRequest, HistoryLog } from "@/types";
import RoleSidebar from "@/components/RoleSidebar";
import JefeAreaView from "@/components/JefeAreaView";
import BodegaView from "@/components/BodegaView";
import TiView from "@/components/TiView";
import ColaboradorView from "@/components/ColaboradorView";
import FinanzasView from "@/components/FinanzasView";
import SupervisorView from "@/components/SupervisorView";
import { Activity, ShieldAlert, BadgeAlert } from "lucide-react";

const BACKEND_URL = "http://localhost:5000";

export default function Home() {
  const [activeRole, setActiveRole] = useState<string>("Jefe de Área");
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
        fetch(`${BACKEND_URL}/api/assets`),
        fetch(`${BACKENDURL ? BACKEND_URL : ""}/api/requests`), // safety
        fetch(`${BACKEND_URL}/api/history`)
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
    fetchData();
  }, [fetchData]);

  // Reset database to initial state
  const handleReset = async () => {
    setIsResetting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/reset`, {
        method: "POST",
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
      const res = await fetch(`${BACKEND_URL}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(`${BACKEND_URL}/api/assets/${qr}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setErrorMsg("No se pudo establecer conexión con el backend Flask.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Evaluate repair D2
  const handleDiagnoseAsset = async (qr: string, repairCost: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/assets/${qr}/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repair_cost: repairCost, emisor: "Técnico TI" })
      });
      
      const resData = await res.json();
      if (res.ok) {
        await fetchData();
        return resData;
      }
    } catch (e) {
      console.error("Error diagnosing asset:", e);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  // Finance Decision D3 (Baja / Extension)
  const handleFinanceDecision = async (
    qr: string,
    action: "baja" | "extension",
    justification?: string,
    motivo?: string
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/assets/${qr}/finance-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, justification, motivo, emisor: "Finanzas DAE" })
      });
      if (res.ok) {
        await fetchData();
        return true;
      } else {
        const resData = await res.json();
        alert(resData.error || "Error al procesar decisión financiera");
        return false;
      }
    } catch (e) {
      console.error("Error in finance decision:", e);
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  // Report external incident
  const handleReportIncident = async (qr: string, policeReportNum: string, description: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/assets/${qr}/incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ police_report_num: policeReportNum, description, emisor: "Colaborador" })
      });
      if (res.ok) {
        await fetchData();
        return true;
      }
    } catch (e) {
      console.error("Error reporting incident:", e);
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar navigation */}
      <RoleSidebar
        currentRole={activeRole}
        setRole={setActiveRole}
        onReset={handleReset}
        isResetting={isResetting}
      />

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
              Rol Activo: {activeRole}
            </div>
          </div>
        </header>

        {/* Dynamic View Selector */}
        <div className="transition-all duration-300">
          {isLoading && assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Activity className="h-10 w-10 text-violet-400 animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Estableciendo conexión y cargando datos...</p>
            </div>
          ) : (
            <>
              {activeRole === "Jefe de Área" && (
                <JefeAreaView
                  assets={assets}
                  requests={requests}
                  onCreateRequest={handleCreateRequest}
                  onTransitionAsset={handleTransitionAsset}
                  isLoading={isLoading}
                />
              )}

              {activeRole === "Encargado de Bodega" && (
                <BodegaView
                  assets={assets}
                  requests={requests}
                  onTransitionAsset={handleTransitionAsset}
                  errorMsg={errorMsg}
                  setErrorMsg={setErrorMsg}
                  isLoading={isLoading}
                />
              )}

              {activeRole === "Técnico TI" && (
                <TiView
                  assets={assets}
                  onTransitionAsset={handleTransitionAsset}
                  onDiagnoseAsset={handleDiagnoseAsset}
                  isLoading={isLoading}
                />
              )}

              {activeRole === "Colaborador" && (
                <ColaboradorView
                  assets={assets}
                  onTransitionAsset={handleTransitionAsset}
                  onReportIncident={handleReportIncident}
                  isLoading={isLoading}
                />
              )}

              {activeRole === "Finanzas" && (
                <FinanzasView
                  assets={assets}
                  logs={logs}
                  onFinanceDecision={handleFinanceDecision}
                  isLoading={isLoading}
                />
              )}

              {activeRole === "Auditoría / Supervisor" && (
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
