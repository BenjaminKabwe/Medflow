"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PatientBillSchema } from "@/lib/schema";
import { Services } from "@prisma/client";
import { z } from "zod";

import { Button } from "../ui/button";
import { CardHeader } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Form } from "../ui/form";
import { CustomInput } from "../custom-input";
import { addNewBill } from "@/app/actions/medical";

interface DataProps {
  id?: string | number;
  appId?: string | number;
  servicesData: Services[];
}

export const AddBills = ({ id, appId, servicesData }: DataProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [data, setData] = useState<{ value: string; label: string }[]>([]);

  const form = useForm<z.infer<typeof PatientBillSchema>>({
    resolver: zodResolver(PatientBillSchema),
    defaultValues: {
      bill_id: String(id),
      service_id: undefined,
      service_date: new Date().toISOString().split("T")[0],
      appointment_id: String(appId),
      quantity: undefined,
      unit_cost: undefined,
      total_cost: undefined,
    },
  });

  const handleOnSubmit = async (values: z.infer<typeof PatientBillSchema>) => {
    try {
      setIsLoading(true);
      const resp = await addNewBill(values);

      if (resp.success) {
        toast.success("Facture ajoutée avec succès !");
        router.refresh();
        form.reset();
      } else if (resp.error) {
        toast.error(resp.msg);
      }
    } catch (error) {
      console.log(error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (servicesData) {
      setData(
        servicesData?.map((service) => ({
          value: service.id.toString(),
          label: service.service_name,
        }))
      );
    }
  }, [servicesData, id]);

  const selectedService = form.watch("service_id");
  const quantity = form.watch("quantity");

  useEffect(() => {
    if (selectedService) {
      const unit_cost = servicesData.find(
        (el) => el.id === Number(selectedService)
      );

      if (unit_cost) {
        form.setValue("unit_cost", unit_cost?.price.toFixed(2));
      }
      if (quantity) {
        form.setValue(
          "total_cost",
          (Number(quantity) * unit_cost?.price!).toFixed(2)
        );
      }
    }
  }, [selectedService, quantity]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="text-sm font-normal">
          <Plus size={22} className="text-gray-400" />
          Ajouter une facture
        </Button>
      </DialogTrigger>
      <DialogContent>
        <CardHeader className="px-0">
          <DialogTitle>Ajouter une facture</DialogTitle>
          <DialogDescription>
            Vérifiez les informations avant de valider la facturation.
          </DialogDescription>
        </CardHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleOnSubmit)}
            className="space-y-8"
          >
            <div className="flex items-center gap-2">
              <CustomInput
                type="select"
                control={form.control}
                name="service_id"
                placeholder="Sélectionner un service"
                label="Nom du service"
                selectList={data!}
              />
              <CustomInput
                type="input"
                control={form.control}
                name="unit_cost"
                placeholder=""
                label="Coût unitaire"
              />
            </div>

            <div className="flex items-center gap-2">
              <CustomInput
                type="input"
                control={form.control}
                name="quantity"
                placeholder="Saisir la quantité"
                label="Quantité"
              />
              <CustomInput
                type="input"
                control={form.control}
                name="total_cost"
                placeholder="0.00"
                label="Coût total"
              />
            </div>

            <CustomInput
              type="input"
              control={form.control}
              name="service_date"
              label="Date du service"
              placeholder=""
              inputType="date"
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 w-full"
            >
              {isLoading ? "Envoi en cours..." : "Soumettre"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
