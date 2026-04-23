import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, TrendingUp, ShoppingBag, Clock, Trophy } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface WeekStat { ongoing: number; avgPrepMin: number; revenue: number; }
interface DayStat {
  ordersCount: number;
  revenue: number;
  avgPrepMin: number;
  topProducts: { name: string; qty: number }[];
  hourly: { hour: string; orders: number; revenue: number }[];
}

const STAND_LABEL: Record<string, string> = {
  jardins: "Les Jardins",
  pazzo: "Pazzo Pazzo",
  cantina: "The Butcher / Cantina",
  saigon: "Ô Little Saigon",
};

const Reporting = () => {
  const [week, setWeek] = useState<WeekStat>({ ongoing: 0, avgPrepMin: 0, revenue: 0 });
  const [day, setDay] = useState<DayStat>({ ordersCount: 0, revenue: 0, avgPrepMin: 0, topProducts: [], hourly: [] });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      // ====== Semaine (7j) — CA uniquement sur commandes ENCAISSÉES
      const since7 = new Date(); since7.setDate(since7.getDate() - 7);
      const { data: ongoing } = await supabase
        .from("orders")
        .select("id")
        .in("status", ["nouveau", "en_preparation", "pret", "recupere"]);
      const { data: weekOrders } = await supabase
        .from("orders")
        .select("total, created_at, updated_at, status")
        .eq("status", "encaisse")
        .gte("created_at", since7.toISOString());
      const wRevenue = (weekOrders ?? []).reduce((s, o: any) => s + Number(o.total), 0);
      const wAvgMs = (weekOrders ?? []).length
        ? (weekOrders ?? []).reduce((s, o: any) => s + (new Date(o.updated_at).getTime() - new Date(o.created_at).getTime()), 0) / (weekOrders ?? []).length
        : 0;
      setWeek({ ongoing: ongoing?.length ?? 0, avgPrepMin: Math.round(wAvgMs / 60000), revenue: wRevenue });

      // ====== Jour — CA uniquement sur ENCAISSÉES
      const startDay = new Date(); startDay.setHours(0, 0, 0, 0);
      const { data: dayOrders } = await supabase
        .from("orders")
        .select("id, total, created_at, updated_at, status, order_items(name, quantity)")
        .eq("status", "encaisse")
        .gte("created_at", startDay.toISOString());

      const dList = dayOrders ?? [];
      const dRevenue = dList.reduce((s, o: any) => s + Number(o.total), 0);
      const dAvgMs = dList.length
        ? dList.reduce((s, o: any) => s + (new Date(o.updated_at).getTime() - new Date(o.created_at).getTime()), 0) / dList.length
        : 0;

      const productMap = new Map<string, number>();
      dList.forEach((o: any) => (o.order_items ?? []).forEach((it: any) => {
        productMap.set(it.name, (productMap.get(it.name) ?? 0) + it.quantity);
      }));
      const topProducts = Array.from(productMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, qty]) => ({ name, qty }));

      const hourMap = new Map<number, { orders: number; revenue: number }>();
      for (let h = 8; h <= 23; h++) hourMap.set(h, { orders: 0, revenue: 0 });
      dList.forEach((o: any) => {
        const h = new Date(o.created_at).getHours();
        const cur = hourMap.get(h) ?? { orders: 0, revenue: 0 };
        cur.orders += 1; cur.revenue += Number(o.total);
        hourMap.set(h, cur);
      });
      const hourly = Array.from(hourMap.entries()).map(([h, v]) => ({
        hour: `${String(h).padStart(2, "0")}h`, orders: v.orders, revenue: Math.round(v.revenue),
      }));

      setDay({ ordersCount: dList.length, revenue: dRevenue, avgPrepMin: Math.round(dAvgMs / 60000), topProducts, hourly });
      setLoading(false);
    };
    fetchAll();
  }, []);

  const generatePDF = async () => {
    setGenerating(true);
    const since = new Date(); since.setDate(since.getDate() - 7);
    const { data } = await supabase
      .from("order_items")
      .select("name, stand, quantity, unit_price, orders!inner(created_at, status)")
      .eq("orders.status", "encaisse")
      .gte("orders.created_at", since.toISOString());

    const byStand: Record<string, { count: number; revenue: number; items: Map<string, { qty: number; rev: number }> }> = {};
    (data ?? []).forEach((it: any) => {
      const s = it.stand;
      if (!byStand[s]) byStand[s] = { count: 0, revenue: 0, items: new Map() };
      byStand[s].count += it.quantity;
      byStand[s].revenue += it.quantity * Number(it.unit_price);
      const cur = byStand[s].items.get(it.name) ?? { qty: 0, rev: 0 };
      cur.qty += it.quantity;
      cur.rev += it.quantity * Number(it.unit_price);
      byStand[s].items.set(it.name, cur);
    });

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Les Jardins Sur Le Toit", 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Rapport hebdomadaire · ${since.toLocaleDateString("fr-FR")} → ${new Date().toLocaleDateString("fr-FR")}`, 14, 26);

    let y = 36;
    autoTable(doc, {
      startY: y,
      head: [["Stand", "Articles vendus", "CA (EUR)"]],
      body: Object.entries(byStand).map(([s, v]) => [STAND_LABEL[s] ?? s, String(v.count), v.revenue.toFixed(2)]),
      theme: "striped",
      headStyles: { fillColor: [45, 80, 22] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    Object.entries(byStand).forEach(([s, v]) => {
      doc.setFontSize(13);
      doc.setTextColor(45, 80, 22);
      doc.text(STAND_LABEL[s] ?? s, 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Produit", "Qté", "CA (EUR)"]],
        body: Array.from(v.items.entries())
          .sort((a, b) => b[1].rev - a[1].rev)
          .map(([n, x]) => [n, String(x.qty), x.rev.toFixed(2)]),
        theme: "grid",
        headStyles: { fillColor: [168, 213, 186], textColor: 30 },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
      if (y > 260) { doc.addPage(); y = 20; }
    });

    doc.save(`rapport-hebdo-${new Date().toISOString().slice(0, 10)}.pdf`);
    setGenerating(false);
    toast.success("Rapport généré 🎉");
  };

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-emerald-400" size={20} />
          <h2 className="text-xl font-bold text-slate-100">Performance du jour</h2>
          <span className="text-xs text-slate-500">· {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
        </div>
        <p className="text-[11px] text-slate-500 -mt-2">CA basé uniquement sur les commandes encaissées 💶</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: ShoppingBag, label: "Commandes encaissées", value: loading ? "…" : day.ordersCount, color: "text-emerald-400" },
            { icon: TrendingUp, label: "CA du jour", value: loading ? "…" : `${day.revenue.toFixed(2).replace(".", ",")}€`, color: "text-amber-400" },
            { icon: Clock, label: "Temps moyen prépa", value: loading ? "…" : `${day.avgPrepMin} min`, color: "text-sky-400" },
            { icon: Trophy, label: "En cours", value: loading ? "…" : week.ongoing, color: "text-pink-400" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{c.label}</p>
                  <Icon size={14} className={c.color} />
                </div>
                <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-amber-400" />
            <h3 className="font-bold text-slate-100 text-sm">Top 3 des produits du jour</h3>
          </div>
          {day.topProducts.length === 0 ? (
            <p className="text-sm text-slate-500">Pas encore de ventes encaissées aujourd'hui.</p>
          ) : (
            <ul className="space-y-2">
              {day.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center justify-between bg-slate-950/50 rounded-lg px-3 py-2">
                  <span className="text-slate-200 text-sm flex items-center gap-2">
                    <span className="text-lg">{medals[i]}</span> {p.name}
                  </span>
                  <span className="text-emerald-400 font-bold text-sm">{p.qty} vendus</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="font-bold text-slate-100 text-sm mb-3">Affluence par heure</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={day.hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(v: any, n: string) => n === "revenue" ? [`${v}€`, "CA"] : [v, "Commandes"]}
                />
                <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Vue hebdomadaire</h2>
          <p className="text-xs text-slate-500">7 derniers jours · CA encaissé uniquement</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Commandes en cours", value: loading ? "…" : week.ongoing },
            { label: "Temps moyen prépa", value: loading ? "…" : `${week.avgPrepMin} min` },
            { label: "CA encaissé (7j)", value: loading ? "…" : `${week.revenue.toFixed(2).replace(".", ",")}€` },
          ].map((c) => (
            <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">{c.label}</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{c.value}</p>
            </div>
          ))}
        </div>

        <Button onClick={generatePDF} disabled={generating} className="bg-emerald-600 hover:bg-emerald-500">
          {generating ? <Loader2 className="animate-spin mr-2" size={14} /> : <FileDown className="mr-2" size={14} />}
          Générer le rapport hebdomadaire (PDF)
        </Button>
      </section>
    </div>
  );
};

export default Reporting;
