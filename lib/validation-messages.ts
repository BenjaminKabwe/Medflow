import type { Lang } from "@/lib/i18n";

/**
 * Zod validation messages are declared at module scope inside schemas, so they
 * cannot read the active language. Schema messages are a mix of FR and EN.
 * This dictionary is keyed by the exact source message string and provides both
 * language variants; `translateValidationMessage` is applied at display time in
 * the shared <FormMessage> component so every form's errors show in the active
 * language regardless of the source language baked into the schema.
 */
const MESSAGES: Record<string, { fr: string; en: string }> = {
  // ── Review ──
  "L'avis doit contenir au moins 1 caractère": { fr: "L'avis doit contenir au moins 1 caractère", en: "Review must be at least 1 character" },
  "L'avis ne peut pas dépasser 500 caractères": { fr: "L'avis ne peut pas dépasser 500 caractères", en: "Review can't exceed 500 characters" },

  // ── Patient form (EN source) ──
  "First name must be at least 2 characters": { fr: "Le prénom doit contenir au moins 2 caractères", en: "First name must be at least 2 characters" },
  "First name can't be more than 50 characters": { fr: "Le prénom ne peut pas dépasser 50 caractères", en: "First name can't be more than 50 characters" },
  "Last name must be at least 2 characters": { fr: "Le nom doit contenir au moins 2 caractères", en: "Last name must be at least 2 characters" },
  "Last name can't be more than 50 characters": { fr: "Le nom ne peut pas dépasser 50 caractères", en: "Last name can't be more than 50 characters" },
  "Gender is required": { fr: "Le sexe est requis", en: "Gender is required" },
  "Enter phone number": { fr: "Numéro de téléphone invalide", en: "Enter phone number" },
  "Invalid email address.": { fr: "Adresse e-mail invalide.", en: "Invalid email address." },
  "Address must be at least 5 characters": { fr: "L'adresse doit contenir au moins 5 caractères", en: "Address must be at least 5 characters" },
  "Address must be at most 500 characters": { fr: "L'adresse ne peut pas dépasser 500 caractères", en: "Address must be at most 500 characters" },
  "Marital status is required.": { fr: "La situation matrimoniale est requise.", en: "Marital status is required." },
  "Emergency contact name is required.": { fr: "Le nom du contact d'urgence est requis.", en: "Emergency contact name is required." },
  "Emergency contact must be at most 50 characters": { fr: "Le contact d'urgence ne peut pas dépasser 50 caractères", en: "Emergency contact must be at most 50 characters" },
  "Relations with contact person required": { fr: "Le lien de parenté est requis", en: "Relations with contact person required" },
  "You must agree to the privacy policy.": { fr: "Vous devez accepter la politique de confidentialité.", en: "You must agree to the privacy policy." },
  "You must agree to the terms of service.": { fr: "Vous devez accepter les conditions d'utilisation.", en: "You must agree to the terms of service." },
  "You must agree to the medical treatment terms.": { fr: "Vous devez accepter les conditions de soins médicaux.", en: "You must agree to the medical treatment terms." },

  // ── Appointment ──
  "Select physician": { fr: "Sélectionnez un médecin", en: "Select physician" },
  "Select type of appointment": { fr: "Sélectionnez un type de rendez-vous", en: "Select type of appointment" },
  "Select appointment date": { fr: "Sélectionnez une date de rendez-vous", en: "Select appointment date" },
  "Select appointment time": { fr: "Sélectionnez une heure de rendez-vous", en: "Select appointment time" },

  // ── Doctor / Staff (FR source) ──
  "Le nom doit contenir au moins 2 caractères": { fr: "Le nom doit contenir au moins 2 caractères", en: "Name must be at least 2 characters" },
  "Le nom ne peut pas dépasser 50 caractères": { fr: "Le nom ne peut pas dépasser 50 caractères", en: "Name can't exceed 50 characters" },
  "Numéro de téléphone invalide": { fr: "Numéro de téléphone invalide", en: "Invalid phone number" },
  "L'adresse doit contenir au moins 5 caractères": { fr: "L'adresse doit contenir au moins 5 caractères", en: "Address must be at least 5 characters" },
  "L'adresse ne peut pas dépasser 500 caractères": { fr: "L'adresse ne peut pas dépasser 500 caractères", en: "Address can't exceed 500 characters" },
  "La spécialisation est requise.": { fr: "La spécialisation est requise.", en: "Specialization is required." },
  "Le numéro de licence est requis": { fr: "Le numéro de licence est requis", en: "License number is required" },
  "Le type est requis.": { fr: "Le type est requis.", en: "Type is required." },
  "Le département est requis.": { fr: "Le département est requis.", en: "Department is required." },
  "Le mot de passe doit contenir au moins 8 caractères !": { fr: "Le mot de passe doit contenir au moins 8 caractères !", en: "Password must be at least 8 characters!" },
  "Le rôle est requis.": { fr: "Le rôle est requis.", en: "Role is required." },
  "Adresse e-mail invalide.": { fr: "Adresse e-mail invalide.", en: "Invalid email address." },

  // ── Vital signs (EN source) ──
  "Enter recorded body temperature": { fr: "Saisissez la température corporelle", en: "Enter recorded body temperature" },
  "Enter recorded heartbeat rate": { fr: "Saisissez la fréquence cardiaque", en: "Enter recorded heartbeat rate" },
  "Enter recorded systolic blood pressure": { fr: "Saisissez la tension systolique", en: "Enter recorded systolic blood pressure" },
  "Enter recorded diastolic blood pressure": { fr: "Saisissez la tension diastolique", en: "Enter recorded diastolic blood pressure" },
  "Enter recorded weight (Kg)": { fr: "Saisissez le poids (kg)", en: "Enter recorded weight (Kg)" },
  "Enter recorded height (Cm)": { fr: "Saisissez la taille (cm)", en: "Enter recorded height (Cm)" },

  // ── Diagnosis / Bills ──
  "Symptoms required": { fr: "Symptômes requis", en: "Symptoms required" },
  "Diagnosis required": { fr: "Diagnostic requis", en: "Diagnosis required" },
  "Quantity is required": { fr: "La quantité est requise", en: "Quantity is required" },
  "Unit cost is required": { fr: "Le coût unitaire est requis", en: "Unit cost is required" },
  "Total cost is required": { fr: "Le coût total est requis", en: "Total cost is required" },
  "Le nom du service est requis": { fr: "Le nom du service est requis", en: "Service name is required" },
  "Le prix est requis": { fr: "Le prix est requis", en: "Price is required" },
  "La description est requise": { fr: "La description est requise", en: "Description is required" },

  // ── Pharmacy / Lab (FR source) ──
  "Le nom est requis": { fr: "Le nom est requis", en: "Name is required" },
  "La DCI est requise": { fr: "La DCI est requise", en: "INN is required" },
  "Le dosage est requis": { fr: "Le dosage est requis", en: "Dosage is required" },
  "L'unité est requise": { fr: "L'unité est requise", en: "Unit is required" },
  "Le téléphone est requis": { fr: "Le téléphone est requis", en: "Phone is required" },
  "N° de lot requis": { fr: "N° de lot requis", en: "Batch number required" },
  "N° de lot requis pour une réception": { fr: "N° de lot requis pour une réception", en: "Batch number required for a reception" },
  "Type de mouvement invalide pour un ajustement": { fr: "Type de mouvement invalide pour un ajustement", en: "Invalid movement type for an adjustment" },
  "Motif requis": { fr: "Motif requis", en: "Reason required" },
  "Patient requis": { fr: "Patient requis", en: "Patient required" },
  "Médicament requis": { fr: "Médicament requis", en: "Medication required" },
  "Fournisseur requis": { fr: "Fournisseur requis", en: "Supplier required" },
  "Au moins un médicament à dispenser": { fr: "Au moins un médicament à dispenser", en: "At least one medication to dispense" },
  "Au moins un médicament à commander": { fr: "Au moins un médicament à commander", en: "At least one medication to order" },
  "Au moins un médicament à prescrire": { fr: "Au moins un médicament à prescrire", en: "At least one medication to prescribe" },
  "Date de péremption requise": { fr: "Date de péremption requise", en: "Expiry date required" },
  "La date de péremption doit être future": { fr: "La date de péremption doit être future", en: "Expiry date must be in the future" },
  "Posologie requise": { fr: "Posologie requise", en: "Dosage required" },
  "Sélectionne au moins une analyse": { fr: "Sélectionne au moins une analyse", en: "Select at least one test" },
  "Résultat requis": { fr: "Résultat requis", en: "Result required" },
  "Coût unitaire invalide": { fr: "Coût unitaire invalide", en: "Invalid unit cost" },
  "Prix de vente invalide": { fr: "Prix de vente invalide", en: "Invalid selling price" },
  "Email invalide": { fr: "Email invalide", en: "Invalid email" },
  "Indique au moins une quantité reçue": { fr: "Indique au moins une quantité reçue", en: "Enter at least one received quantity" },
  "Quantité non nulle": { fr: "Quantité non nulle", en: "Quantity must be non-zero" },
  "Quantité positive requise": { fr: "Quantité positive requise", en: "Positive quantity required" },

  // ── Payment methods / Cashier ──
  "Le libellé est requis": { fr: "Le libellé est requis", en: "Label is required" },
  "Les frais ne peuvent pas être négatifs": { fr: "Les frais ne peuvent pas être négatifs", en: "Fees can't be negative" },
  "Le fond de caisse ne peut pas être négatif": { fr: "Le fond de caisse ne peut pas être négatif", en: "Opening float can't be negative" },
  "Le montant de clôture ne peut pas être négatif": { fr: "Le montant de clôture ne peut pas être négatif", en: "Closing amount can't be negative" },

  // ── Common Zod defaults ──
  "Required": { fr: "Ce champ est requis", en: "Required" },
  "Invalid email": { fr: "Adresse e-mail invalide", en: "Invalid email" },
};

/** Translate a schema validation message to the active language (falls back to the source string). */
export function translateValidationMessage(msg: string, lang: Lang): string {
  return MESSAGES[msg]?.[lang] ?? msg;
}
