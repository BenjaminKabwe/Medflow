import { getLang } from "@/lib/i18n-server";

/**
 * Bilingual response messages returned by server actions (shown to the user via
 * toast on the client). Server actions are `"use server"`, so they can read the
 * active language from the `medflow_lang` cookie via getLang(). Use `am("key")`
 * inside an action to return the message in the caller's language.
 */
const MSG = {
  fr: {
    // Shared
    unauthorized: "Non autorisé",
    invalidData: "Données invalides",
    invalidFields: "Données invalides. Vérifiez les champs.",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    // Pharmacy
    adjustmentSaved: "Ajustement enregistré",
    supplierCreated: "Fournisseur créé",
    supplierUpdated: "Fournisseur mis à jour",
    supplierExists: "Un fournisseur avec ce nom existe déjà",
    medAdded: "Médicament ajouté au catalogue",
    medNotFound: "Médicament introuvable",
    medUpdated: "Médicament mis à jour",
    medDeleted: "Médicament supprimé",
    medExists: "Un médicament identique existe déjà (DCI + dosage + forme)",
    receptionSaved: "Réception enregistrée, stock mis à jour",
    // Admin
    doctorAdded: "Médecin ajouté avec succès",
    staffAdded: "Personnel ajouté avec succès",
    // Cashier
    alreadyCollected: "Ce paiement a déjà été encaissé",
    paymentCollected: "Paiement encaissé avec succès",
    sessionClosed: "Session clôturée avec succès",
    cashSessionClosed: "Session de caisse clôturée avec succès",
    cashSessionOpened: "Session de caisse ouverte avec succès",
    // Appointment
    appointmentCreated: "Rendez-vous créé avec succès",
    vitalsAdded: "Signes vitaux ajoutés avec succès",
    // Lab
    testCancelled: "Analyse annulée",
    noValidTest: "Aucune analyse valide sélectionnée.",
    testAlreadyClosed: "Cette analyse est déjà clôturée",
    testCannotCancel: "Cette analyse ne peut plus être annulée",
    resultSaved: "Résultat enregistré",
    // Payment methods
    configUpdated: "Configuration mise à jour avec succès",
    // Prescription
    rxCannotCancel: "Cette ordonnance ne peut plus être annulée",
    rxCancelled: "Ordonnance annulée",
    // Medical
    billGenerated: "Facture générée avec succès",
    notAllowedBill: "Vous n'êtes pas autorisé à ajouter une facture",
    // Patient
    patientUpdated: "Les informations sur le patient ont été mis à jour avec succès",
    patientCreated: "Patient créé avec succès",
    // General
    reviewCreated: "Avis créé avec succès",
    recordDeleted: "Enregistrement supprimé avec succès",
  },
  en: {
    // Shared
    unauthorized: "Unauthorized",
    invalidData: "Invalid data",
    invalidFields: "Invalid data. Check the fields.",
    genericError: "An error occurred. Please try again.",
    // Pharmacy
    adjustmentSaved: "Adjustment saved",
    supplierCreated: "Supplier created",
    supplierUpdated: "Supplier updated",
    supplierExists: "A supplier with this name already exists",
    medAdded: "Medication added to catalog",
    medNotFound: "Medication not found",
    medUpdated: "Medication updated",
    medDeleted: "Medication deleted",
    medExists: "An identical medication already exists (INN + dosage + form)",
    receptionSaved: "Reception recorded, stock updated",
    // Admin
    doctorAdded: "Doctor added successfully",
    staffAdded: "Staff added successfully",
    // Cashier
    alreadyCollected: "This payment has already been collected",
    paymentCollected: "Payment collected successfully",
    sessionClosed: "Session closed successfully",
    cashSessionClosed: "Cashier session closed successfully",
    cashSessionOpened: "Cashier session opened successfully",
    // Appointment
    appointmentCreated: "Appointment created successfully",
    vitalsAdded: "Vital signs added successfully",
    // Lab
    testCancelled: "Test cancelled",
    noValidTest: "No valid test selected.",
    testAlreadyClosed: "This test is already closed",
    testCannotCancel: "This test can no longer be cancelled",
    resultSaved: "Result saved",
    // Payment methods
    configUpdated: "Configuration updated successfully",
    // Prescription
    rxCannotCancel: "This prescription can no longer be cancelled",
    rxCancelled: "Prescription cancelled",
    // Medical
    billGenerated: "Bill generated successfully",
    notAllowedBill: "You are not allowed to add a bill",
    // Patient
    patientUpdated: "Patient information updated successfully",
    patientCreated: "Patient created successfully",
    // General
    reviewCreated: "Review created successfully",
    recordDeleted: "Record deleted successfully",
  },
};

export type ActionMsgKey = keyof typeof MSG.fr;

/** Returns the response message for `key` in the caller's active language. */
export async function am(key: ActionMsgKey): Promise<string> {
  return MSG[await getLang()][key];
}
