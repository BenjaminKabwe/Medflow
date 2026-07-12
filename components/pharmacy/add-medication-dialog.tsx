"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createMedication } from "@/app/actions/pharmacy";
import { MedicationSchema } from "@/lib/schema";
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
import { Switch } from "@/components/ui/switch";

const STR = {
  fr: {
    forms: {
      COMPRIME: "Comprimé",
      GELULE: "Gélule",
      SIROP: "Sirop",
      SUSPENSION: "Suspension",
      INJECTION: "Injection",
      POMMADE: "Pommade",
      CREME: "Crème",
      GOUTTE: "Goutte",
      SUPPOSITOIRE: "Suppositoire",
      PATCH: "Patch",
      INHALATEUR: "Inhalateur",
      SACHET: "Sachet",
      AUTRE: "Autre",
    } as Record<string, string>,
    errorAdd: "Erreur lors de l'ajout du médicament",
    trigger: "Nouveau médicament",
    title: "Ajouter un médicament",
    description:
      "Renseigne les informations générales. Le stock est géré séparément.",
    name: "Nom commercial",
    namePh: "ex. Doliprane",
    dci: "DCI",
    dciPh: "ex. Paracétamol",
    form: "Forme",
    dosage: "Dosage",
    dosagePh: "ex. 500 mg",
    unit: "Unité de vente",
    unitPh: "ex. boîte de 20",
    category: "Catégorie",
    categoryPh: "ex. Antibiotique",
    reorder: "Seuil réappro",
    barcode: "Code-barres (optionnel)",
    descriptionLabel: "Description",
    rxRequired: "Ordonnance requise",
    rxRequiredHint: "Le patient doit présenter une prescription",
    saving: "Enregistrement…",
    save: "Enregistrer",
  },
  en: {
    forms: {
      COMPRIME: "Tablet",
      GELULE: "Capsule",
      SIROP: "Syrup",
      SUSPENSION: "Suspension",
      INJECTION: "Injection",
      POMMADE: "Ointment",
      CREME: "Cream",
      GOUTTE: "Drops",
      SUPPOSITOIRE: "Suppository",
      PATCH: "Patch",
      INHALATEUR: "Inhaler",
      SACHET: "Sachet",
      AUTRE: "Other",
    } as Record<string, string>,
    errorAdd: "Error while adding the medication",
    trigger: "New medication",
    title: "Add a medication",
    description:
      "Enter the general information. Stock is managed separately.",
    name: "Brand name",
    namePh: "e.g. Doliprane",
    dci: "INN",
    dciPh: "e.g. Paracetamol",
    form: "Form",
    dosage: "Dosage",
    dosagePh: "e.g. 500 mg",
    unit: "Sales unit",
    unitPh: "e.g. box of 20",
    category: "Category",
    categoryPh: "e.g. Antibiotic",
    reorder: "Reorder level",
    barcode: "Barcode (optional)",
    descriptionLabel: "Description",
    rxRequired: "Prescription required",
    rxRequiredHint: "The patient must present a prescription",
    saving: "Saving…",
    save: "Save",
  },
} as const;

type FormValues = z.infer<typeof MedicationSchema>;

export function AddMedicationDialog() {
  const { lang } = useLanguage();
  const t = STR[lang];
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(MedicationSchema),
    defaultValues: {
      name: "",
      dci: "",
      form: "COMPRIME",
      dosage: "",
      unit: "boîte",
      category: "",
      description: "",
      barcode: "",
      prescription_required: true,
      reorder_level: 10,
      is_active: true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      const res = await createMedication(values);
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
      setIsLoading(false);
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
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t.name}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.namePh} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dci"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.dci}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.dciPh} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="form"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.form}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(t.forms).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
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
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.dosage}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.dosagePh} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.unit}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.unitPh} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.category}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.categoryPh}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reorder_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.reorder}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t.barcode}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t.descriptionLabel}</FormLabel>
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

            <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3">
              <div>
                <p className="text-sm font-medium">{t.rxRequired}</p>
                <p className="text-xs text-slate-500">{t.rxRequiredHint}</p>
              </div>
              <FormField
                control={form.control}
                name="prescription_required"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? t.saving : t.save}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
