import type {
  Appointment,
  Doctor,
  Patient,
  PatientBills,
  Payment,
  Services,
} from "@prisma/client";
import { StyleSheet } from "@react-pdf/renderer";

// ── Types ─────────────────────────────────────────────────────────────────────

export type FactureData = Payment & {
  patient: Patient;
  appointment: Appointment & { doctor: Doctor };
  bills: (PatientBills & { service: Services })[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

export const GREEN = "#0F6E56";
export const LIGHT_GREEN = "#E8F5F1";
export const ORANGE = "#D97706";
export const LIGHT_ORANGE = "#FEF3C7";
export const GRAY = "#6B7280";
export const DARK = "#111827";
export const BORDER = "#E5E7EB";

export const CLINIC = {
  name: "Clinique MedFlow",
  address: "123 Avenue de la Santé, Kinshasa, RDC",
  phone: "+243 97 000 0000",
  email: "contact@medflow.cd",
};

// ── Styles ────────────────────────────────────────────────────────────────────

export const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  header: {
    backgroundColor: GREEN,
    paddingHorizontal: 32,
    paddingVertical: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "column" },
  headerClinicName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  headerClinicSub: { fontSize: 8, color: "#A7F3D0", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  headerFacture: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  headerNum: { fontSize: 10, color: "#A7F3D0", marginTop: 3 },
  body: { paddingHorizontal: 32, paddingTop: 24 },
  infoRow: { flexDirection: "row", gap: 16, marginBottom: 20 },
  infoBlock: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    padding: 12,
  },
  infoBlockTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GREEN,
    paddingBottom: 5,
  },
  infoLine: { flexDirection: "row", marginBottom: 3 },
  infoLabel: { width: 90, color: GRAY, fontSize: 8 },
  infoValue: { flex: 1, fontFamily: "Helvetica-Bold", fontSize: 8 },
  tableTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: GREEN,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableHeaderCell: { color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 8 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRowAlt: { backgroundColor: "#F9FAFB" },
  tableCell: { fontSize: 8.5, color: DARK },
  colNum: { width: 28 },
  colService: { flex: 1 },
  colDate: { width: 64 },
  colQty: { width: 32, textAlign: "center" },
  colUnit: { width: 64, textAlign: "right" },
  colTotal: { width: 70, textAlign: "right" },
  totalsWrapper: { marginTop: 16, flexDirection: "row", justifyContent: "flex-end" },
  totalsBlock: {
    width: 220,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    overflow: "hidden",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  totalRowHighlight: { backgroundColor: LIGHT_GREEN },
  totalLabel: { fontSize: 8.5, color: GRAY },
  totalValue: { fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  totalValueGreen: { fontSize: 10, fontFamily: "Helvetica-Bold", color: GREEN },
  statusWrapper: { marginTop: 16, flexDirection: "row" },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: { fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 32,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 7, color: GRAY },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export const money = (n: number) =>
  n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " $";

export const invoiceNum = (payment: Payment) =>
  `FACT-${new Date(payment.bill_date).getFullYear()}-${payment.id.toString().padStart(5, "0")}`;
