"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { FaQuestion } from "react-icons/fa6";
import { toast } from "sonner";
import { deleteDataById } from "@/app/actions/general";
import { ProfileImage } from "./profile-image";
import { SmallCard } from "./small-card";

interface ActionDialogProps {
  type: "doctor" | "staff" | "delete";
  id: string;
  data?: any;
  deleteType?: "doctor" | "staff" | "patient" | "payment" | "bill";
}
export const ActionDialog = ({
  id,
  data,
  type,
  deleteType,
}: ActionDialogProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (type === "delete") {
    const handleDelete = async () => {
      try {
        setLoading(true);

        const res = await deleteDataById(id, deleteType!);

        if (res.success) {
          toast.success("Enregistrement supprimé avec succès");
          router.refresh();
        } else {
          toast.error("Échec de la suppression");
        }
      } catch (error) {
        console.log(error);
        toast.error("Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant={"outline"}
            className="flex items-center justify-center rounded-full text-red-500"
          >
            <Trash2 size={16} className="text-red-500" />
            {deleteType === "patient" && "Supprimer"}
          </Button>
        </DialogTrigger>

        <DialogContent>
          <div className="flex flex-col items-center justify-center py-6">
            <DialogTitle>
              <div className="bg-red-200 p-4 rounded-full mb-2">
                <FaQuestion size={50} className="text-red-500" />
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Confirmation de suppression de l'enregistrement
            </DialogDescription>

            <span className="text-xl text-black">Confirmation de suppression</span>
            <p className="text-sm">
              Êtes-vous sûr de vouloir supprimer cet enregistrement ?
            </p>

            <div className="flex justify-center mt-6 items-center gap-x-3">
              <DialogClose asChild>
                <Button variant={"outline"} className="px-4 py-2">
                  Annuler
                </Button>
              </DialogClose>

              <Button
                disabled={loading}
                variant="outline"
                className="px-4 py-2 text-sm font-medium bg-destructive text-white hover:bg-destructive hover:text-white"
                onClick={handleDelete}
              >
                Oui, supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (type === "staff") {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant={"outline"}
            className="flex items-center justify-center rounded-full text-blue-600/10 text-blue-600 hover:underline"
          >
            Voir
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-[300px] md:max-w-2xl max-h-[90%] p-8 overflow-y-auto">
          <DialogTitle className="text-lg text-gray-600 font-semibold mb-4">
            Informations du personnel
          </DialogTitle>
          <DialogDescription className="sr-only">
            Détails du membre du personnel sélectionné
          </DialogDescription>

          <div className="flex justify-between">
            <div className="flex gap-3 items-center">
              <ProfileImage
                url={data?.img!}
                name={data?.name}
                className="xl:size-20"
                bgColor={data?.colorCode!}
                textClassName="xl:text-2xl"
              />

              <div className="flex flex-col">
                <p className="text-xl font-semibold">{data?.name}</p>
                <span className="text-gray-600 text-sm md:text-base capitalize">
                  {data?.role?.toLowerCase()}
                </span>
                <span className="text-blue-500 text-sm">Temps plein</span>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-6">
            <div className="flex flex-col md:flex-row md:flex-wrap md:items-center  gap-y-4 md:gap-x-0 xl:justify-between">
              {/* <SmallCard label="Full Name" value={data?.name} /> */}
              <SmallCard label="Adresse e-mail" value={data?.email} />
              <SmallCard label="Téléphone" value={data?.phone} />
            </div>

            <div>
              <SmallCard label="Adresse" value={data?.address || "N/A"} />
            </div>

            <div className="flex flex-col md:flex-row md:flex-wrap md:items-center  gap-y-4 md:gap-x-0 xl:justify-between">
              <SmallCard label="Rôle" value={data?.role} />
              <SmallCard label="Département" value={data?.department || "N/A"} />
              <SmallCard
                label="Numéro de licence"
                value={data?.license_number || "N/A"}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  return null;
};
