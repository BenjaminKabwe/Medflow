"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { generateBill } from "@/app/actions/medical";
import { PaymentSchema } from "@/lib/schema";
import { z } from "zod";
import { CustomInput } from "../custom-input";
import { Button } from "../ui/button";
import { CardHeader } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Form } from "../ui/form";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    success: "Facture générée avec succès !",
    error: "Une erreur est survenue. Veuillez réessayer.",
    trigger: "Générer la facture finale",
    title: "Facture médicale du patient",
    total: "Total",
    discountPh: "ex : 5",
    discount: "Remise (%)",
    billDate: "Date de facturation",
    generating: "Génération en cours...",
    generate: "Générer la facture",
  },
  en: {
    success: "Bill generated successfully!",
    error: "An error occurred. Please try again.",
    trigger: "Generate final bill",
    title: "Patient medical bill",
    total: "Total",
    discountPh: "e.g. 5",
    discount: "Discount (%)",
    billDate: "Billing date",
    generating: "Generating...",
    generate: "Generate bill",
  },
};

interface DataProps {
  id?: string | number;
  total_bill: number;
}

const todayStr = () => new Date().toISOString().split("T")[0];

export const GenerateFinalBills = ({ id, total_bill }: DataProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];

  const form = useForm<z.infer<typeof PaymentSchema>>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: {
      id: id?.toString(),
      bill_date: todayStr() as unknown as Date,
      discount: "0",
      total_amount: total_bill.toString(),
    },
  });

  const handleOnSubmit = async (values: z.infer<typeof PaymentSchema>) => {
    try {
      setIsLoading(true);

      const resp = await generateBill(values);

      if (resp.success) {
        toast.success(t.success);
        setOpen(false);
        router.refresh();
        form.reset();
      } else if (resp.error) {
        toast.error(resp.msg);
      }
    } catch (error) {
      console.log(error);
      toast.error(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-sm font-normal">
          <Plus size={22} className="text-gray-400" />
          {t.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <CardHeader className="px-0">
          <DialogTitle>{t.title}</DialogTitle>
        </CardHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleOnSubmit)}
            className="space-y-8"
          >
            <div className="flex items-center gap-2">
              <div>
                <span className="text-sm text-gray-500">{t.total}</span>
                <p className="text-3xl font-semibold">
                  {total_bill?.toFixed(2)}
                </p>
              </div>
            </div>

            <CustomInput
              type="input"
              control={form.control}
              name="discount"
              placeholder={t.discountPh}
              label={t.discount}
            />

            <CustomInput
              type="input"
              control={form.control}
              name="bill_date"
              label={t.billDate}
              placeholder=""
              inputType="date"
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 w-full"
            >
              {isLoading ? t.generating : t.generate}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
