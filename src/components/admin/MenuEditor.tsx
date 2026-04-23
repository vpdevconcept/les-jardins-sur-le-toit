import { useState } from "react";
import { useMenuItems } from "@/hooks/useMenuItems";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { MenuItem } from "@/data/menu";

interface Draft { name: string; price: number; description: string; is_available: boolean; }

const MenuEditor = () => {
  const { items, categories, loading } = useMenuItems();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const getDraft = (item: MenuItem): Draft =>
    drafts[item.id] ?? { name: item.name, price: item.price, description: item.description, is_available: true };

  const update = (item: MenuItem, patch: Partial<Draft>) =>
    setDrafts((p) => ({ ...p, [item.id]: { ...getDraft(item), ...patch } }));

  const save = async (item: MenuItem) => {
    const d = getDraft(item);
    setSavingId(item.id);
    const { error } = await supabase.from("menu_items").update({
      name: d.name, price: d.price, description: d.description, is_available: d.is_available,
    }).eq("id", item.id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else {
      toast.success(`« ${d.name} » mis à jour`);
      setDrafts((p) => { const n = { ...p }; delete n[item.id]; return n; });
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const cItems = items.filter((i) => i.category === cat.id);
        if (cItems.length === 0) return null;
        return (
          <section key={cat.id} className="space-y-2">
            <h3 className="font-bold text-slate-200 text-lg">{cat.icon} {cat.label}</h3>
            <div className="space-y-2">
              {cItems.map((item) => {
                const d = getDraft(item);
                const dirty = !!drafts[item.id];
                return (
                  <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="grid md:grid-cols-3 gap-2">
                      <div className="md:col-span-2">
                        <Label className="text-xs text-slate-500">Nom</Label>
                        <Input value={d.name} onChange={(e) => update(item, { name: e.target.value })} className="bg-slate-950 border-slate-700 text-slate-100" />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Prix (€)</Label>
                        <Input type="number" step="0.10" min="0" value={d.price} onChange={(e) => update(item, { price: parseFloat(e.target.value) || 0 })} className="bg-slate-950 border-slate-700 text-slate-100" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Description</Label>
                      <Textarea value={d.description} onChange={(e) => update(item, { description: e.target.value })} rows={2} className="bg-slate-950 border-slate-700 text-slate-100" />
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <Switch id={`avail-${item.id}`} checked={d.is_available} onCheckedChange={(v) => update(item, { is_available: v })} />
                        <Label htmlFor={`avail-${item.id}`} className="text-sm text-slate-300">{d.is_available ? "Disponible" : "Masqué"}</Label>
                      </div>
                      <Button size="sm" onClick={() => save(item)} disabled={!dirty || savingId === item.id} className="bg-emerald-600 hover:bg-emerald-500">
                        {savingId === item.id ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} className="mr-1" />Enregistrer</>}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default MenuEditor;
