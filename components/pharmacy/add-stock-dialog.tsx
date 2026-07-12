"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { addStockEntry } from "@/app/actions/pharmacy";
import { StockEntrySchema } from "@/lib/schema";
import { useLanguage } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STR = {
  fr: {
    errorAdd: "Erreur lors de l'entrée en stock",
    trigger: "Entrée en stock",
    title: "Nouvelle entrée en stock",
    description:
      "Enregistre un lot reçu (achat, don, réappro). Le stock existant du même lot sera cumulé.",
    medication: "Médicament",
    selectPh: "Sélectionner",
    batch: "N° de lot",
    batchPh: "ex. LOT-2026-042",
    quantity: "Quantité",
    unitCost: "Coût unitaire (FC)",
    sellingPrice: "Prix de vente (FC)",
    expiry: "Date de péremption",
    supplier: "Fournisseur (optionnel)",
    supplierPh: "Aucun",
    notes: "Notes (optionnel)",
    saving: "Enregistrement…",
    save: "Enregistrer l'entrée",
  },
  en: {
    errorAdd: "Error while recording the stock entry",
    trigger: "Stock entry",
    title: "New stock entry",
    description:
      "Record a received batch (purchase, donation, restock). Existing stock from the same batch will be added up.",
    medication: "Medication",
    selectPh: "Select",
    batch: "Batch no.",
    batchPh: "e.g. LOT-2026-042",
    quantity: "Quantity",
    unitCost: "Unit cost (FC)",
    sellingPrice: "Selling price (FC)",
    expiry: "Expiry date",
    supplier: "Supplier (optional)",
    supplierPh: "None",
    notes: "Notes (optional)",
    saving: "Saving…",
    save: "Save entry",
  },
} as const;

type FormValues = z.infer<typeof StockEntrySchema>;

interface Props {
  medications: Array<{ id: number; name: string; dosage: string; unit: string }>;
  suppliers: Array<{ id: number; name: string }>;
}

export function AddStockDialog({ medications, suppliers }: Props) {
  const { lang } = useLanguage();
  const t = STR[lang];
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(StockEntrySchema),
    defaultValues: {
      medication_id: 0,
      batch_number: "",
      quantity: 0,
      unit_cost: 0,
      selling_price: 0,
      expiry_date: undefined as unknown as Date,
      supplier_id: null,
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      const res = await addStockEntry(values);
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(t.errorAdd);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-sm gap-2">
          <Plus size={16} /> {t.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="px-0 pt-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-4 h-4" /> {t.title}
          </DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="medication_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.medication}</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.selectPh} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {medications.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.name} — {m.dosage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="batch_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.batch}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.batchPh} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.quantity}</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.unitCost}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="selling_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.sellingPrice}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t.expiry}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={
                          field.value instanceof Date
                            ? field.value.toISOString().slice(0, 10)
                            : (field.value as unknown as string) ?? ""
                        }
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t.supplier}</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) =>
                        field.onChange(v ? Number(v) : null)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.supplierPh} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Enregistrement…" : "Enregistrer l'entrée"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
