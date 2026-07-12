import { z } from "zod";

export const reviewSchema = z.object({
  patient_id: z.string(),
  staff_id: z.string(),
  rating: z.number().min(1).max(5),
  comment: z
    .string()
    .min(1, "L'avis doit contenir au moins 1 caractère")
    .max(500, "L'avis ne peut pas dépasser 500 caractères"),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;

export const PatientFormSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(30, "First name can't be more than 50 characters"),
  last_name: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(30, "Last name can't be more than 50 characters"),
  date_of_birth: z.coerce.date(),
  gender: z.enum(["MALE", "FEMALE"], { message: "Gender is required" }),

  phone: z.string().min(10, "Enter phone number").max(10, "Enter phone number"),
  email: z.string().email("Invalid email address."),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address must be at most 500 characters"),
    marital_status: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"], {
      message: "Marital status is required.",
    }),
  emergency_contact_name: z
    .string()
    .min(2, "Emergency contact name is required.")
    .max(50, "Emergency contact must be at most 50 characters"),
  emergency_contact_number: z
    .string()
    .min(10, "Enter phone number")
    .max(10, "Enter phone number"),
  relation: z.enum(["mother", "father", "husband", "wife", "other"], {
    message: "Relations with contact person required",
  }),
  blood_group: z.string().optional(),
  allergies: z.string().optional(),
  medical_conditions: z.string().optional(),
  medical_history: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_number: z.string().optional(),
  privacy_consent: z
    .boolean()
    .default(false)
    .refine((val) => val === true, {
      message: "You must agree to the privacy policy.",
    }),
  service_consent: z
    .boolean()
    .default(false)
    .refine((val) => val === true, {
      message: "You must agree to the terms of service.",
    }),
  medical_consent: z
    .boolean()
    .default(false)
    .refine((val) => val === true, {
      message: "You must agree to the medical treatment terms.",
    }),
  img: z.string().optional(),
});

export const AppointmentSchema = z.object({
  doctor_id: z.string().min(1, "Select physician"),
  type: z.string().min(1, "Select type of appointment"),
  appointment_date: z.string().min(1, "Select appointment date"),
  time: z.string().min(1, "Select appointment time"),
  note: z.string().optional(),
});

export const DoctorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  phone: z.string().min(10, "Numéro de téléphone invalide").max(10, "Numéro de téléphone invalide"),
  email: z.string().email("Adresse e-mail invalide."),
  address: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caractères")
    .max(500, "L'adresse ne peut pas dépasser 500 caractères"),
  specialization: z.string().min(2, "La spécialisation est requise."),
  license_number: z.string().min(2, "Le numéro de licence est requis"),
  type: z.enum(["FULL", "PART"], { message: "Le type est requis." }),
  department: z.string().min(2, "Le département est requis."),
  img: z.string().optional(),
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères !" })
    .optional()
    .or(z.literal("")),
});

export const workingDaySchema = z.object({
  day: z.enum([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]),
  start_time: z.string(),
  close_time: z.string(),
});
export const WorkingDaysSchema = z.array(workingDaySchema).optional();

export const StaffSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  role: z.enum(["NURSE", "LAB_TECHNICIAN", "CASHIER", "PHARMACIST"], {
    message: "Le rôle est requis.",
  }),
  phone: z
    .string()
    .min(10, "Numéro de téléphone invalide")
    .max(10, "Numéro de téléphone invalide"),
  email: z.string().email("Adresse e-mail invalide."),
  address: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caractères")
    .max(500, "L'adresse ne peut pas dépasser 500 caractères"),
  license_number: z.string().optional(),
  department: z.string().optional(),
  img: z.string().optional(),
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères !" })
    .optional()
    .or(z.literal("")),
});

export const VitalSignsSchema = z.object({
  patient_id: z.string(),
  medical_id: z.string(),
  body_temperature: z.coerce.number({
    message: "Enter recorded body temperature",
  }),
  heartRate: z.string({ message: "Enter recorded heartbeat rate" }),
  systolic: z.coerce.number({
    message: "Enter recorded systolic blood pressure",
  }),
  diastolic: z.coerce.number({
    message: "Enter recorded diastolic blood pressure",
  }),
  respiratory_rate: z.coerce.number().optional(),
  oxygen_saturation: z.coerce.number().optional(),
  weight: z.coerce.number({ message: "Enter recorded weight (Kg)" }),
  height: z.coerce.number({ message: "Enter recorded height (Cm)" }),
});

export const DiagnosisSchema = z.object({
  patient_id: z.string(),
  medical_id: z.string(),
  doctor_id: z.string(),
  symptoms: z.string({ message: "Symptoms required" }),
  diagnosis: z.string({ message: "Diagnosis required" }),
  notes: z.string().optional(),
  prescribed_medications: z.string().optional(),
  follow_up_plan: z.string().optional(),
});

export const PaymentSchema = z.object({
  id: z.string(),
  // patient_id: z.string(),
  // appointment_id: z.string(),
  bill_date: z.coerce.date(),
  // payment_date: z.string(),
  discount: z.string({ message: "discount" }),
  total_amount: z.string(),
  // amount_paid: z.string(),
});

export const PatientBillSchema = z.object({
  bill_id: z.string(),
  service_id: z.string(),
  service_date: z.string(),
  appointment_id: z.string(),
  quantity: z.string({ message: "Quantity is required" }),
  unit_cost: z.string({ message: "Unit cost is required" }),
  total_cost: z.string({ message: "Total cost is required" }),
});

export const ServicesSchema = z.object({
  service_name: z.string({ message: "Le nom du service est requis" }),
  price: z.coerce.number({ message: "Le prix est requis" }).positive("Le prix doit être positif"),
  description: z.string({ message: "La description est requise" }),
});

// ─── Pharmacie ────────────────────────────────────────────────────────────────

export const MedicationFormEnum = z.enum([
  "COMPRIME",
  "GELULE",
  "SIROP",
  "SUSPENSION",
  "INJECTION",
  "POMMADE",
  "CREME",
  "GOUTTE",
  "SUPPOSITOIRE",
  "PATCH",
  "INHALATEUR",
  "SACHET",
  "AUTRE",
]);

export const StockMovementTypeEnum = z.enum([
  "IN",
  "OUT",
  "ADJUSTMENT",
  "RETURN",
  "EXPIRED",
  "LOSS",
]);

export const MedicationSchema = z.object({
  name: z.string().trim().min(2, "Le nom est requis").max(120),
  dci: z.string().trim().min(2, "La DCI est requise").max(120),
  form: MedicationFormEnum,
  dosage: z.string().trim().min(1, "Le dosage est requis").max(60),
  unit: z.string().trim().min(1, "L'unité est requise").max(60),
  category: z.string().max(60).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  barcode: z.string().max(60).optional().nullable(),
  prescription_required: z.coerce.boolean().default(true),
  reorder_level: z.coerce.number().int().min(0).default(10),
  is_active: z.coerce.boolean().default(true),
});
export type MedicationFormValues = z.infer<typeof MedicationSchema>;

export const SupplierSchema = z.object({
  name: z.string().trim().min(2, "Le nom est requis").max(120),
  contact_person: z.string().max(120).optional().nullable(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().trim().min(6, "Le téléphone est requis").max(30),
  address: z.string().max(300).optional().nullable(),
  tax_id: z.string().max(60).optional().nullable(),
  is_active: z.coerce.boolean().default(true),
});
export type SupplierFormValues = z.infer<typeof SupplierSchema>;

export const StockEntrySchema = z.object({
  medication_id: z.coerce.number().int().positive(),
  batch_number: z.string().trim().min(1, "N° de lot requis").max(60),
  quantity: z.coerce.number().int().positive("Quantité positive requise"),
  unit_cost: z.coerce.number().nonnegative("Coût unitaire invalide"),
  selling_price: z.coerce.number().nonnegative("Prix de vente invalide"),
  expiry_date: z.coerce.date().refine((d) => d > new Date(), {
    message: "La date de péremption doit être future",
  }),
  supplier_id: z.coerce.number().int().positive().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});
export type StockEntryFormValues = z.infer<typeof StockEntrySchema>;

export const StockAdjustmentSchema = z.object({
  stock_id: z.coerce.number().int().positive(),
  type: StockMovementTypeEnum.refine((t) => t !== "IN" && t !== "OUT", {
    message: "Type de mouvement invalide pour un ajustement",
  }),
  quantity: z.coerce.number().int().refine((q) => q !== 0, "Quantité non nulle"),
  reason: z.string().trim().min(1, "Motif requis").max(300),
});
export type StockAdjustmentFormValues = z.infer<typeof StockAdjustmentSchema>;

export const DispensationItemSchema = z.object({
  stock_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive("Quantité positive requise"),
  instructions: z.string().max(300).optional().nullable(),
});

export const DispensationSchema = z.object({
  patient_id: z.string().min(1, "Patient requis"),
  medical_record_id: z.coerce.number().int().positive().optional().nullable(),
  prescription_id: z.coerce.number().int().positive().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  items: z
    .array(DispensationItemSchema)
    .min(1, "Au moins un médicament à dispenser"),
});
export type DispensationFormValues = z.infer<typeof DispensationSchema>;

// ─── Bons de commande fournisseurs ───────────────────────────────────────────

export const PurchaseOrderItemSchema = z.object({
  medication_id: z.coerce.number().int().positive("Médicament requis"),
  quantity_ordered: z.coerce.number().int().positive("Quantité positive requise"),
  unit_cost: z.coerce.number().nonnegative("Coût unitaire invalide"),
});

export const PurchaseOrderSchema = z.object({
  supplier_id: z.coerce.number().int().positive("Fournisseur requis"),
  expected_date: z.coerce.date().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  items: z
    .array(PurchaseOrderItemSchema)
    .min(1, "Au moins un médicament à commander"),
});
export type PurchaseOrderFormValues = z.infer<typeof PurchaseOrderSchema>;

/** Réception d'une ligne : crée un lot en stock (n° lot, péremption, prix vente). */
export const ReceiveOrderItemSchema = z.object({
  item_id: z.coerce.number().int().positive(),
  quantity_received: z.coerce.number().int().nonnegative(),
  batch_number: z.string().trim().max(60).optional().nullable(),
  expiry_date: z.coerce.date().optional().nullable(),
  selling_price: z.coerce.number().nonnegative().optional().nullable(),
});

export const ReceiveOrderSchema = z
  .object({
    order_id: z.coerce.number().int().positive(),
    items: z.array(ReceiveOrderItemSchema).min(1),
  })
  .refine((v) => v.items.some((i) => i.quantity_received > 0), {
    message: "Indique au moins une quantité reçue",
  })
  .superRefine((v, ctx) => {
    v.items.forEach((i, idx) => {
      if (i.quantity_received > 0) {
        if (!i.batch_number || i.batch_number.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "N° de lot requis pour une réception",
            path: ["items", idx, "batch_number"],
          });
        }
        if (!i.expiry_date) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Date de péremption requise",
            path: ["items", idx, "expiry_date"],
          });
        }
      }
    });
  });
export type ReceiveOrderFormValues = z.infer<typeof ReceiveOrderSchema>;

// ─── Ordonnances (prescriptions) ─────────────────────────────────────────────

export const PrescriptionItemSchema = z.object({
  medication_id: z.coerce.number().int().positive("Médicament requis"),
  quantity_prescribed: z.coerce
    .number()
    .int()
    .positive("Quantité positive requise"),
  dosage: z.string().trim().min(1, "Posologie requise").max(300),
  duration: z.string().max(100).optional().nullable(),
  instructions: z.string().max(300).optional().nullable(),
});

export const PrescriptionSchema = z.object({
  patient_id: z.string().min(1, "Patient requis"),
  medical_record_id: z.coerce.number().int().positive().optional().nullable(),
  appointment_id: z.coerce.number().int().positive().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  items: z
    .array(PrescriptionItemSchema)
    .min(1, "Au moins un médicament à prescrire"),
});
export type PrescriptionFormValues = z.infer<typeof PrescriptionSchema>;

export const SupplierIdSchema = z.coerce.number().int().positive();
export const MedicationIdSchema = z.coerce.number().int().positive();

// ── Laboratoire ────────────────────────────────────────────────
export const LabRequestSchema = z.object({
  record_id: z.coerce.number().int().positive(),
  service_ids: z
    .array(z.coerce.number().int().positive())
    .min(1, "Sélectionne au moins une analyse"),
  notes: z.string().max(500).optional().nullable(),
});
export type LabRequestValues = z.infer<typeof LabRequestSchema>;

export const LabResultSchema = z.object({
  id: z.coerce.number().int().positive(),
  result: z.string().trim().min(1, "Résultat requis").max(5000),
  notes: z.string().max(1000).optional().nullable(),
});
export type LabResultValues = z.infer<typeof LabResultSchema>;
