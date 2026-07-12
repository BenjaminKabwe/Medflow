"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Banknote, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
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
import { openSession } from "@/app/actions/cashier";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    negativeAmount: "Le fond de caisse ne peut pas être négatif",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    openSession: "Ouvrir une session",
    openCashSession: "Ouvrir la session de caisse",
    description: "Indiquez le fond de caisse disponible à l'ouverture.",
    initialFund: "Fond de caisse initial",
    notes: "Notes (optionnel)",
    notesPlaceholder: "Observations à l'ouverture…",
    cancel: "Annuler",
    opening: "Ouverture…",
    confirmOpen: "Ouvrir la session",
  },
  en: {
    negativeAmount: "The cash float cannot be negative",
    genericError: "An error occurred. Please try again.",
    openSession: "Open a session",
    openCashSession: "Open cash session",
    description: "Enter the cash float available at opening.",
    initialFund: "Initial cash float",
    notes: "Notes (optional)",
    notesPlaceholder: "Observations at opening…",
    cancel: "Cancel",
    opening: "Opening…",
    confirmOpen: "Open session",
  },
} as const;

const Schema = (t: (typeof STR)[keyof typeof STR]) =>
  z.object({
    opening_amount: z.coerce.number().min(0, t.negativeAmount),
    notes: z.string().max(500).optional(),
  });

type Values = z.infer<ReturnType<typeof Schema>>;

export function OpenSessionDialog() {
  const { lang } = useLanguage();
  const t = STR[lang];
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(Schema(t)),
    defaultValues: { opening_amount: 0, notes: "" },
  });

  const handleOpenChange = (val: boolean) => {
    if (val) form.reset({ opening_amount: 0, notes: "" });
    setOpen(val);
  };

  const onSubmit = async (values: Values) => {
    setIsLoading(true);
    try {
      const result = await openSession(values);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(t.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <PlayCircle className="w-4 h-4" />
          {t.openSession}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            {t.openCashSession}
          </DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-1"
          >
            <FormField
              control={form.control}
              name="opening_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.initialFund}</FormLabel>
                  <FormControl>
                    <div className="flex items-center border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <span className="px-3 py-2 bg-muted text-muted-foreground text-sm border-l select-none">
                        USD
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.notes}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t.notesPlaceholder}
                      rows={2}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isLoading ? t.opening : t.confirmOpen}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
