"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { addNewService } from "@/app/actions/admin";

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { ServicesSchema } from "@/lib/schema";
import { CustomInput } from "../custom-input";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    successAdd: "Service ajouté avec succès !",
    errorGeneric: "Une erreur est survenue. Veuillez réessayer.",
    trigger: "Ajouter un service",
    title: "Ajouter un nouveau service",
    description:
      "Veuillez renseigner les informations du service. Ces données seront utilisées dans la facturation et les dossiers médicaux.",
    nameLabel: "Nom du service",
    priceLabel: "Prix du service",
    descLabel: "Description du service",
    save: "Enregistrer",
  },
  en: {
    successAdd: "Service added successfully!",
    errorGeneric: "An error occurred. Please try again.",
    trigger: "Add a service",
    title: "Add a new service",
    description:
      "Please provide the service details. This data will be used in billing and medical records.",
    nameLabel: "Service name",
    priceLabel: "Service price",
    descLabel: "Service description",
    save: "Save",
  },
};

export const AddService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];

  const form = useForm<z.infer<typeof ServicesSchema>>({
    resolver: zodResolver(ServicesSchema),
    defaultValues: {
      service_name: undefined,
      price: undefined,
      description: undefined,
    },
  });

  const handleOnSubmit = async (values: z.infer<typeof ServicesSchema>) => {
    try {
      setIsLoading(true);
      const resp = await addNewService(values);

      if (resp.success) {
        toast.success(t.successAdd);

        router.refresh();

        form.reset();
      } else if (resp.error) {
        toast.error(resp.msg);
      }
    } catch (error) {
      console.log(error);
      toast.error(t.errorGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" className="text-sm font-normal">
            <Plus size={22} className="text-gray-500" /> {t.trigger}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <CardHeader className="px-0">
            <DialogTitle>{t.title}</DialogTitle>
            <DialogDescription>
              {t.description}
            </DialogDescription>
          </CardHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleOnSubmit)}
              className="space-y-8"
            >
              <CustomInput
                type="input"
                control={form.control}
                name="service_name"
                label={t.nameLabel}
                placeholder=""
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.priceLabel}</FormLabel>
                    <FormControl>
                      <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <span className="px-3 py-2 bg-muted text-muted-foreground text-sm font-medium border-r select-none">
                          $
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-4">
                <CustomInput
                  type="textarea"
                  control={form.control}
                  name="description"
                  placeholder=""
                  label={t.descLabel}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 w-full"
              >
                {t.save}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
