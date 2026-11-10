import { useState } from "react";
import Sidebar from "../components/Sidebar";
import LabAccessViewer from "../components/LabAccessViewer";
import NfcPanel from "../components/NfcPanel";

export default function RegistroAccessi({ user, token, logout }) {
  const [refresh, setRefresh] = useState(0);
  const canManage = user?.role === "admin" || user?.role === "technician";
  return (
    <div className="layout-sidebar">
      <Sidebar user={user} logout={logout} activePage="registro" />

      <main className="main-content">
        <div className="p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900" style={{ fontFamily: "Work Sans" }}>
              Registro accessi
            </h1>
            <p className="text-slate-500 mt-1">
              Ingressi e uscite del laboratorio di metrologia. Ogni firma compare qui subito e il registro si scarica in Word.
            </p>
          </div>

          {canManage && <NfcPanel token={token} onChange={() => setRefresh((n) => n + 1)} />}

          <LabAccessViewer key={refresh} token={token} canDelete={user?.role === "admin"} />
        </div>
      </main>
    </div>
  );
}
