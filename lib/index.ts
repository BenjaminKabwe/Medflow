export const GENDER = [
  { label: "Homme", value: "MALE" },
  { label: "Femme", value: "FEMALE" },
];

export const MARITAL_STATUS = [
  { label: "Célibataire", value: "SINGLE" },
  { label: "Marié(e)", value: "MARRIED" },
  { label: "Divorcé(e)", value: "DIVORCED" },
  { label: "Veuf(ve)", value: "WIDOWED" },
];

export const RELATION = [
  { value: "mother", label: "mère" },
  { value: "father", label: "père" },
  { value: "husband", label: "mari" },
  { value: "wife", label: "épouse" },
  { value: "other", label: "autre" },
];

export const USER_ROLES = {
  ADMIN: "ADMIN" as string,
  DOCTOR: "DOCTOR",
  NURSE: "NURSE",
  LAB_TECHNICIAN: "LAB_TECHNICIAN",
  PATIENT: "PATIENT",
  CASHIER: "CASHIER",
};
