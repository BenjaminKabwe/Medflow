"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Receipt } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { collectPayment } from "@/app/actions/cashier";
import type { PaymentMethodConfigRow } from "@/types";

const COLLECT_METHODS: Record<string, { label: string; color: string }> = {
  CASH:          { label: "Espèces",           color: "text-emerald-600" },
  CARD:          { label: "Carte bancaire",     color: "text-sky-600" },
  MOBILE_MONEY:  { label: "Mobile Money",       color: "text-orange-600" },
  INSURANCE:     { label: "Assurance",          color: "text-violet-600" },
  BANK_TRANSFER: { label: "Virement bancaire",  color: "text-slate-600" },
};

const Schema = z.object({
  payment_method: z.string().min(1, "Sélectionnez un mode de paiement"),
  amount_paid: z.coerce
    .number()
    .positive("Le montant encaissé doit être supérieur à 0"),
  discount: z.coerce.number().min(0).optional().default(0),
});

type Values = z.infer<typeof Schema>;

interface CollectPaymentDialogProps {
  paymentId: number;
  patientName: string;
  totalAmount: number;
  activeMethods: PaymentMethodConfigRow[];
  hasActiveSession: boolean;
}

export function CollectPaymentDialog({
  paymentId,
  patientName,
  totalAmount,
  activeMethods,
  hasActiveSession,
}: CollectPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: {
      payment_method: activeMethods[0]?.method ?? "",
      amount_paid: totalAmount,
      discount: 0,
    },
  });

  const handleOpenChange = (val: boolean) => {
    if (val) {
      setReceiptNumber(null);
      form.reset({
        payment_method: activeMethods[0]?.method ?? "",
        amount_paid: totalAmount,
        discount: 0,
      });
    }
    setOpen(val);
  };

  const onSubmit = async (values: Values) => {
    setIsLoading(true);
    try {
      const result = await collectPayment(paymentId, {
        payment_method: values.payment_method as never,
        amount_paid: values.amount_paid,
        discount: values.discount ?? 0,
      });
      if (result.success && result.data) {
        setReceiptNumber(result.data.receipt_number);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          disabled={!hasActiveSession}
          title={!hasActiveSession ? "Ouvrez une session pour encaisser" : undefined}
          className="h-8 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
        >
          <Receipt className="w-3.5 h-3.5" />
          Encaisser
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            Encaisser le paiement
          </DialogTitle>
          <DialogDescription>
            Patient :{" "}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {patientName}
            </span>
          </DialogDescription>
        </DialogHeader>

        {receiptNumber ? (
          <div className="mt-2 space-y-4">
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Paiement enregistré avec succès
              </p>
              <div className="w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                  N° de reçu
                </p>
                <p className="font-mono text-base font-bold text-slate-800 dark:text-slate-100 tracking-wide">
                  {receiptNumber}
                </p>
              </div>
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Fermer
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 mt-1"
            >
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode de paiement</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeMethods.map((m) => (
                          <SelectItem key={m.method} value={m.method}>
                            <span className={COLLECT_METHODS[m.method]?.color ?? ""}>
                              {m.label}
                            </span>
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
                name="amount_paid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant encaissé</FormLabel>
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
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remise</FormLabel>
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

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? "Enregistrement…" : "Confirmer l'encaissement"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
