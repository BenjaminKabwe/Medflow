"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updatePaymentMethodConfig } from "@/app/actions/payment-methods";
import type { PaymentMethodConfigRow } from "@/types";

// ─── Metadata sub-types ───────────────────────────────────────────────────────

type Operator = {
  code: string;
  name: string;
  active: boolean;
  ussd?: string;
};

type Provider = {
  code: string;
  name: string;
  active: boolean;
  coveragePercent?: number;
};

function parseMeta(metadata: unknown): {
  operators: Operator[];
  providers: Provider[];
} {
  if (!metadata || typeof metadata !== "object") {
    return { operators: [], providers: [] };
  }
  const m = metadata as Record<string, unknown>;
  return {
    operators: (m.operators as Operator[] | undefined) ?? [],
    providers: (m.providers as Provider[] | undefined) ?? [],
  };
}

// ─── Form schema ──────────────────────────────────────────────────────────────

const ConfigFormSchema = z.object({
  label: z.string().min(1, "Le libellé est requis").max(50),
  description: z.string().max(300).optional(),
  fees: z.coerce.number().min(0, "Les frais ne peuvent pas être négatifs").max(100),
  isActive: z.boolean(),
  activeOperators: z.array(z.string()).optional(),
  activeProviders: z.array(z.string()).optional(),
});

type ConfigFormValues = z.infer<typeof ConfigFormSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface PaymentMethodDialogProps {
  config: PaymentMethodConfigRow;
}

export function PaymentMethodDialog({ config }: PaymentMethodDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { operators, providers } = parseMeta(config.metadata);

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(ConfigFormSchema),
    defaultValues: {
      label: config.label,
      description: config.description ?? "",
      fees: config.fees,
      isActive: config.isActive,
      activeOperators: operators.filter((o) => o.active).map((o) => o.code),
      activeProviders: providers.filter((p) => p.active).map((p) => p.code),
    },
  });

  // Reset form to current config when dialog opens
  const handleOpenChange = (value: boolean) => {
    if (value) {
      form.reset({
        label: config.label,
        description: config.description ?? "",
        fees: config.fees,
        isActive: config.isActive,
        activeOperators: operators.filter((o) => o.active).map((o) => o.code),
        activeProviders: providers.filter((p) => p.active).map((p) => p.code),
      });
    }
    setOpen(value);
  };

  const onSubmit = async (values: ConfigFormValues) => {
    setIsLoading(true);
    try {
      const result = await updatePaymentMethodConfig({
        // Cast to PaymentMethod enum — valid post-migration
        method: config.method as never,
        label: values.label,
        description: values.description || undefined,
        fees: values.fees,
        isActive: values.isActive,
        activeOperators: values.activeOperators,
        activeProviders: values.activeProviders,
      });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
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
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8 px-3 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60"
        >
          <Settings className="w-3.5 h-3.5" />
          Configurer
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Configuration
            <span className="text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {config.method}
            </span>
          </DialogTitle>
          <DialogDescription>
            Personnalisez le libellé, la description et les frais de ce mode de
            paiement.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            {/* Label */}
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Libellé affiché</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex : Espèces" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Description affichée au caissier…"
                      rows={2}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fees */}
            <FormField
              control={form.control}
              name="fees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frais de transaction</FormLabel>
                  <FormControl>
                    <div className="flex items-center border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        {...field}
                        className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <span className="px-3 py-2 bg-muted text-muted-foreground text-sm border-l select-none">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* MOBILE_MONEY — opérateurs */}
            {config.method === "MOBILE_MONEY" && operators.length > 0 && (
              <FormField
                control={form.control}
                name="activeOperators"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opérateurs actifs</FormLabel>
                    <div className="space-y-2.5 mt-1 rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                      {operators.map((op) => {
                        const checked = field.value?.includes(op.code) ?? false;
                        return (
                          <div key={op.code} className="flex items-center gap-2.5">
                            <Checkbox
                              id={`op-${op.code}`}
                              checked={checked}
                              onCheckedChange={(val) => {
                                const current = field.value ?? [];
                                field.onChange(
                                  val
                                    ? [...current, op.code]
                                    : current.filter((c) => c !== op.code)
                                );
                              }}
                            />
                            <Label
                              htmlFor={`op-${op.code}`}
                              className="font-normal cursor-pointer text-sm leading-snug"
                            >
                              {op.name}
                              {op.ussd && (
                                <span className="ml-2 text-[11px] font-mono text-slate-400 dark:text-slate-500">
                                  {op.ussd}
                                </span>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* INSURANCE — organismes */}
            {config.method === "INSURANCE" && providers.length > 0 && (
              <FormField
                control={form.control}
                name="activeProviders"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organismes acceptés</FormLabel>
                    <div className="space-y-2.5 mt-1 rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                      {providers.map((p) => {
                        const checked = field.value?.includes(p.code) ?? false;
                        return (
                          <div key={p.code} className="flex items-center gap-2.5">
                            <Checkbox
                              id={`prov-${p.code}`}
                              checked={checked}
                              onCheckedChange={(val) => {
                                const current = field.value ?? [];
                                field.onChange(
                                  val
                                    ? [...current, p.code]
                                    : current.filter((c) => c !== p.code)
                                );
                              }}
                            />
                            <Label
                              htmlFor={`prov-${p.code}`}
                              className="font-normal cursor-pointer text-sm leading-snug"
                            >
                              {p.name}
                              {p.coveragePercent != null && (
                                <span className="ml-2 text-[11px] text-slate-400 dark:text-slate-500">
                                  {p.coveragePercent}% prise en charge
                                </span>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* isActive toggle */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 p-3.5">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">
                      Mode actif
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Les caissiers peuvent utiliser ce mode à l'encaissement
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Buttons */}
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
                {isLoading ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
