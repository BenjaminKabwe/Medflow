"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { XCircle } from "lucide-react";
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
import { closeSession } from "@/app/actions/cashier";

const Schema = z.object({
  closing_amount: z.coerce
    .number()
    .min(0, "Le montant de clôture ne peut pas être négatif"),
  notes: z.string().max(500).optional(),
});

type Values = z.infer<typeof Schema>;

interface CloseSessionDialogProps {
  sessionId: number;
  totalCollected: number;
}

export function CloseSessionDialog({
  totalCollected,
}: CloseSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { closing_amount: 0, notes: "" },
  });

  const handleOpenChange = (val: boolean) => {
    if (val) form.reset({ closing_amount: 0, notes: "" });
    setOpen(val);
  };

  const onSubmit = async (values: Values) => {
    setIsLoading(true);
    try {
      const result = await closeSession(values);
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
          className="gap-2 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <XCircle className="w-4 h-4" />
          Clôturer la session
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            Clôturer la session
          </DialogTitle>
          <DialogDescription>
            Total encaissé :{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {totalCollected.toLocaleString("fr-CD")} USD
            </span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-1"
          >
            <FormField
              control={form.control}
              name="closing_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fond de caisse à la clôture</FormLabel>
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
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Observations à la clôture…"
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
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isLoading ? "Clôture en cours…" : "Confirmer la clôture"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
