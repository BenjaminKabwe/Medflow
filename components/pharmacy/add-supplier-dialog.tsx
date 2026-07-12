"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createSupplier } from "@/app/actions/pharmacy";
import { SupplierSchema } from "@/lib/schema";
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

type FormValues = z.infer<typeof SupplierSchema>;

const STR = {
  fr: {
    errorCreate: "Erreur lors de la création du fournisseur",
    trigger: "Nouveau fournisseur",
    title: "Ajouter un fournisseur",
    description: "Grossiste, laboratoire ou distributeur de médicaments.",
    name: "Raison sociale",
    namePh: "ex. PharmaKin Distribution",
    contact: "Contact",
    phone: "Téléphone",
    email: "Email",
    address: "Adresse",
    taxId: "N° fiscal (optionnel)",
    saving: "Enregistrement…",
    save: "Enregistrer",
  },
  en: {
    errorCreate: "Error while creating the supplier",
    trigger: "New supplier",
    title: "Add a supplier",
    description: "Wholesaler, laboratory or medication distributor.",
    name: "Company name",
    namePh: "e.g. PharmaKin Distribution",
    contact: "Contact",
    phone: "Phone",
    email: "Email",
    address: "Address",
    taxId: "Tax ID (optional)",
    saving: "Saving…",
    save: "Save",
  },
};

export function AddSupplierDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];

  const form = useForm<FormValues>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: {
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      tax_id: "",
      is_active: true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);
      const res = await createSupplier(values);
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
      toast.error(t.errorCreate);
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
            <Truck className="w-4 h-4" /> {t.title}
          </DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.name}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.namePh} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.contact}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.phone}</FormLabel>
                    <FormControl>
                      <Input placeholder="+243…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t.email}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t.address}</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tax_id"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t.taxId}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t.saving : t.save}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
