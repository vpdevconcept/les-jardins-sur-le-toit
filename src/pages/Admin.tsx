import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, LayoutDashboard, UtensilsCrossed, QrCode, BarChart3, Leaf, Wallet } from "lucide-react";
import OrdersBoard from "@/components/admin/OrdersBoard";
import MenuEditor from "@/components/admin/MenuEditor";
import TablesQR from "@/components/admin/TablesQR";
import Reporting from "@/components/admin/Reporting";
import Encaissement from "@/components/admin/Encaissement";

type Section = "orders" | "encaissement" | "menu" | "qr" | "reporting";

const NAV: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "orders", label: "Commandes", icon: LayoutDashboard },
  { id: "encaissement", label: "Encaisser", icon: Wallet },
  { id: "menu", label: "Menu", icon: UtensilsCrossed },
  { id: "qr", label: "Plan de salle", icon: QrCode },
  { id: "reporting", label: "Reporting", icon: BarChart3 },
];

const Admin = () => {
  const { user, isAdmin, isStaff, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("orders");
  const [pendingGuestId, setPendingGuestId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !(isAdmin || isStaff))) {
      navigate("/login", { replace: true });
    }
  }, [user, isAdmin, isStaff, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user || !(isAdmin || isStaff)) return null;

  const handleManageBill = (guestId: string) => {
    setPendingGuestId(guestId);
    setSection("encaissement");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 bg-slate-900 border-r border-slate-800 flex-col p-4">
        <div className="flex items-center gap-2 mb-8">
          <Leaf className="h-5 w-5 text-emerald-400" />
          <span className="font-bold">Control Tower</span>
        </div>
        <nav className="space-y-1 flex-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = section === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setSection(n.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <Icon size={16} /> {n.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 pt-3 space-y-2">
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
          <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate("/login"); }} className="w-full border-slate-700 text-slate-200 hover:bg-slate-800">
            <LogOut size={14} className="mr-1" /> Déconnexion
          </Button>
        </div>
      </aside>

      {/* Mobile top tabs */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-sm">Control Tower</span>
          </div>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/login"); }}>
            <LogOut size={14} />
          </Button>
        </div>
        <div className="flex overflow-x-auto px-2 pb-2 gap-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = section === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setSection(n.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${
                  active ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"
                }`}
              >
                <Icon size={12} /> {n.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 p-4 md:p-6 mt-24 md:mt-0 overflow-auto">
        {section === "orders" && (
          <>
            <h1 className="text-2xl font-bold mb-4">Commandes en temps réel</h1>
            <OrdersBoard />
          </>
        )}
        {section === "encaissement" && (
          <Encaissement
            initialGuestId={pendingGuestId}
            onClosed={() => setPendingGuestId(null)}
          />
        )}
        {section === "menu" && (
          <>
            <h1 className="text-2xl font-bold mb-4">Gestion du menu</h1>
            <MenuEditor />
          </>
        )}
        {section === "qr" && <TablesQR onManageBill={handleManageBill} />}
        {section === "reporting" && <Reporting />}
      </main>
    </div>
  );
};

export default Admin;
