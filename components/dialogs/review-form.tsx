"use client";

import { useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Plus, StarIcon } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { createReview } from "@/app/actions/general";
import { reviewSchema, ReviewFormValues } from "@/lib/schema";
import { useLanguage } from "@/components/providers";

export { reviewSchema };
export type { ReviewFormValues };

const STR = {
  fr: {
    successAdd: "Avis ajouté avec succès",
    errorAdd: "Erreur lors de l'ajout de l'avis",
    errorFail: "Échec de l'ajout de l'avis",
    trigger: "Ajouter un avis",
    title: "Nouvel avis",
    description: "Veuillez remplir le formulaire ci-dessous pour ajouter un avis.",
    ratingLabel: "Note",
    ratingDesc: "Notez le personnel selon votre expérience.",
    commentLabel: "Commentaire",
    commentPh: "Écrivez votre avis ici...",
    commentDesc: "Décrivez votre expérience en détail.",
    submitting: "Envoi en cours...",
    submit: "Soumettre",
  },
  en: {
    successAdd: "Review added successfully",
    errorAdd: "Error while adding the review",
    errorFail: "Failed to add the review",
    trigger: "Add a review",
    title: "New review",
    description: "Please fill in the form below to add a review.",
    ratingLabel: "Rating",
    ratingDesc: "Rate the staff based on your experience.",
    commentLabel: "Comment",
    commentPh: "Write your review here...",
    commentDesc: "Describe your experience in detail.",
    submitting: "Sending...",
    submit: "Submit",
  },
};

export const ReviewForm = ({ staffId }: { staffId: string }) => {
  const router = useRouter();
  const user = useAuth();
  const { lang } = useLanguage();
  const t = STR[lang];
  const [loading, setLoading] = useState(false);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      patient_id: user?.userId as string,
      staff_id: staffId,
      rating: 1,
      comment: "",
    },
  });

  const handleSubmit = async (values: ReviewFormValues) => {
    try {
      setLoading(true);
      const response = await createReview(values);

      if (response.success) {
        toast.success(t.successAdd);
        router.refresh();
      } else {
        toast.error(t.errorAdd);
      }
    } catch (error) {
      console.log(error);
      toast.error(t.errorFail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="px-4 py-2 rounded-lg bg-black/10 text-black hover:bg-transparent font-light"
        >
          <Plus /> {t.trigger}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.ratingLabel}</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => field.onChange(star)}
                        >
                          <StarIcon
                            size={30}
                            className={cn(
                              star <= field.value
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-400"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t.ratingDesc}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.commentLabel}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t.commentPh}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t.commentDesc}
                  </FormDescription>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t.submitting : t.submit}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
