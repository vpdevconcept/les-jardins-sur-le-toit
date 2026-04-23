import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { MenuItem, MenuOption, MenuOptionChoice } from "@/data/menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface SelectedOptions { [optionId: string]: string[] }

interface OptionsDrawerProps {
  item: MenuItem;
  open: boolean;
  onConfirm: (choices: MenuOptionChoice[]) => void;
  onClose: () => void;
}

const OptionsDrawer = ({ item, open, onConfirm, onClose }: OptionsDrawerProps) => {
  const [selected, setSelected] = useState<SelectedOptions>({});

  // Reset selections when drawer opens or item changes
  useEffect(() => {
    if (open) {
      const init: SelectedOptions = {};
      item.options?.forEach((opt) => { init[opt.id] = []; });
      setSelected(init);
    }
  }, [open, item.id]);

  const toggleChoice = (option: MenuOption, choice: MenuOptionChoice) => {
    setSelected((prev) => {
      const current = prev[option.id] || [];
      if (option.type === "single") {
        return { ...prev, [option.id]: current.includes(choice.id) ? [] : [choice.id] };
      }
      return {
        ...prev,
        [option.id]: current.includes(choice.id)
          ? current.filter((c) => c !== choice.id)
          : [...current, choice.id],
      };
    });
  };

  const extraPrice = useMemo(() =>
    item.options?.reduce((sum, opt) =>
      sum + opt.choices
        .filter((c) => (selected[opt.id] || []).includes(c.id))
        .reduce((s, c) => s + c.priceExtra, 0),
    0) ?? 0,
  [selected, item.options]);

  const totalPrice = item.price + extraPrice;

  const canConfirm = !item.options?.some(
    (opt) => opt.required && (selected[opt.id] || []).length === 0
  );

  const missingRequired = item.options?.filter(
    (opt) => opt.required && (selected[opt.id] || []).length === 0
  ) ?? [];

  const handleConfirm = () => {
    if (!canConfirm) return;
    const selectedChoices = item.options?.flatMap((opt) =>
      opt.choices.filter((c) => (selected[opt.id] || []).includes(c.id))
    ) ?? [];
    onConfirm(selectedChoices);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto glass-card border-t border-border pb-safe">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="font-display text-xl">{item.name}</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {item.description}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          {item.options?.map((opt) => (
            <div key={opt.id}>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                {opt.label}
                {opt.required && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                    Obligatoire
                  </span>
                )}
                <span className="text-xs text-muted-foreground font-normal">
                  {opt.type === "single" ? "(1 choix)" : "(plusieurs)"}
                </span>
              </h4>
              <div className="space-y-2">
                {opt.choices.map((choice) => {
                  const isSelected = (selected[opt.id] || []).includes(choice.id);
                  return (
                    <motion.button
                      key={choice.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleChoice(opt, choice)}
                      className={`w-full flex items-center justify-between rounded-xl px-4 py-3.5 text-sm transition-all border ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground shadow-sm"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                        }`}>
                          {isSelected && <Check size={12} className="text-primary-foreground" />}
                        </span>
                        {choice.label}
                      </span>
                      {choice.priceExtra > 0 && (
                        <span className="text-secondary text-xs font-semibold">
                          +{choice.priceExtra.toFixed(2).replace(".", ",")}€
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sticky add button */}
        <div className="sticky bottom-0 pt-4 pb-2 mt-4 bg-gradient-to-t from-background via-background to-transparent">
          {!canConfirm && missingRequired.length > 0 && (
            <p className="text-xs text-destructive text-center mb-2">
              Choisissez : {missingRequired.map((o) => o.label).join(", ")}
            </p>
          )}
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full rounded-full h-12 text-base font-display font-bold bg-primary hover:bg-primary/80 text-primary-foreground shadow-lg disabled:opacity-50"
          >
            Ajouter — {totalPrice.toFixed(2).replace(".", ",")}€
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OptionsDrawer;
