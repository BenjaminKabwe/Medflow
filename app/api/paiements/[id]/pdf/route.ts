import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  type FactureData,
  s,
  CLINIC,
  GREEN,
  ORANGE,
  LIGHT_GREEN,
  LIGHT_ORANGE,
  GRAY,
  fmtDate,
  money,
  invoiceNum,
} from "@/components/pdf/FacturePDF";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

type H = (type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) => unknown;

/** Build the PDF element tree using the real React.createElement (not RSC-vendored). */
function buildDocument(h: H, pdf: Record<string, unknown>, data: FactureData) {
  const { patient, appointment, bills } = data;
  const doctor = appointment.doctor;
  const payable = data.total_amount - data.discount;
  const isPaid = data.status === "PAID";
  const num = invoiceNum(data);

  const { Document, Page, View, Text } = pdf as {
    Document: unknown; Page: unknown; View: unknown; Text: unknown;
  };

  const infoLine = (label: string, value: string) =>
    h(View, { style: s.infoLine },
      h(Text, { style: s.infoLabel }, label),
      h(Text, { style: s.infoValue }, value),
    );

  const cashierLine = data.cashier_name
    ? infoLine("Caissier", data.cashier_name)
    : null;

  const remiseRow = h(View, { style: s.totalRow },
    h(Text, { style: s.totalLabel }, "Remise"),
    h(Text, { style: { ...s.totalValue, color: ORANGE } }, `- ${money(data.discount)}`),
  );

  const resteRow = payable - data.amount_paid > 0.005
    ? h(View, { style: s.totalRow },
        h(Text, { style: { ...s.totalLabel, color: ORANGE } }, "Reste à payer"),
        h(Text, { style: { ...s.totalValue, color: ORANGE } }, money(payable - data.amount_paid)),
      )
    : null;

  const billRows = bills.length === 0
    ? h(View, { style: s.tableRow },
        h(Text, { style: { ...s.tableCell, color: GRAY } }, "Aucune prestation enregistrée."),
      )
    : bills.map((bill, i) =>
        h(View, { key: String(bill.id), style: i % 2 === 1 ? [s.tableRow, s.tableRowAlt] : s.tableRow },
          h(Text, { style: [s.tableCell, s.colNum] }, String(i + 1)),
          h(Text, { style: [s.tableCell, s.colService] }, bill.service.service_name),
          h(Text, { style: [s.tableCell, s.colDate] }, new Date(bill.service_date).toLocaleDateString("fr-FR")),
          h(Text, { style: [s.tableCell, s.colQty] }, String(bill.quantity)),
          h(Text, { style: [s.tableCell, s.colUnit] }, money(bill.unit_cost)),
          h(Text, { style: [s.tableCell, s.colTotal] }, money(bill.total_cost)),
        )
      );

  return h(Document, { title: `Facture ${num}`, author: CLINIC.name, subject: "Facture médicale" },
    h(Page, { size: "A4", style: s.page },

      // ── Header
      h(View, { style: s.header },
        h(View, { style: s.headerLeft },
          h(Text, { style: s.headerClinicName }, CLINIC.name),
          h(Text, { style: s.headerClinicSub }, CLINIC.address),
          h(Text, { style: s.headerClinicSub }, `${CLINIC.phone} · ${CLINIC.email}`),
        ),
        h(View, { style: s.headerRight },
          h(Text, { style: s.headerFacture }, "FACTURE"),
          h(Text, { style: s.headerNum }, num),
        ),
      ),

      // ── Body
      h(View, { style: s.body },

        // Info blocks
        h(View, { style: s.infoRow },
          h(View, { style: s.infoBlock },
            h(Text, { style: s.infoBlockTitle }, "Informations patient"),
            infoLine("Nom complet", `${patient.first_name.toUpperCase()} ${patient.last_name.toUpperCase()}`),
            infoLine("N° dossier", patient.id),
            infoLine("Date de naissance", fmtDate(patient.date_of_birth)),
            infoLine("Téléphone", patient.phone),
          ),
          h(View, { style: s.infoBlock },
            h(Text, { style: s.infoBlockTitle }, "Médecin & rendez-vous"),
            infoLine("Médecin", doctor.name),
            infoLine("Spécialité", doctor.specialization),
            infoLine("Date du RDV", fmtDate(appointment.appointment_date)),
            infoLine("Date de facturation", fmtDate(data.bill_date)),
            cashierLine,
          ),
        ),

        // Table
        h(Text, { style: s.tableTitle }, "Détail des prestations"),
        h(View, { style: s.tableHeader },
          h(Text, { style: [s.tableHeaderCell, s.colNum] }, "N°"),
          h(Text, { style: [s.tableHeaderCell, s.colService] }, "Prestation"),
          h(Text, { style: [s.tableHeaderCell, s.colDate] }, "Date"),
          h(Text, { style: [s.tableHeaderCell, s.colQty] }, "Qté"),
          h(Text, { style: [s.tableHeaderCell, s.colUnit] }, "Prix unit."),
          h(Text, { style: [s.tableHeaderCell, s.colTotal] }, "Total"),
        ),
        ...(Array.isArray(billRows) ? billRows : [billRows]),

        // Totals
        h(View, { style: s.totalsWrapper },
          h(View, { style: s.totalsBlock },
            h(View, { style: s.totalRow },
              h(Text, { style: s.totalLabel }, "Sous-total"),
              h(Text, { style: s.totalValue }, money(data.total_amount)),
            ),
            remiseRow,
            h(View, { style: [s.totalRow, s.totalRowHighlight] },
              h(Text, { style: { ...s.totalLabel, fontFamily: "Helvetica-Bold", color: "#111827" } }, "Montant payable"),
              h(Text, { style: s.totalValueGreen }, money(payable)),
            ),
            h(View, { style: s.totalRow },
              h(Text, { style: s.totalLabel }, "Montant payé"),
              h(Text, { style: s.totalValue }, money(data.amount_paid)),
            ),
            resteRow,
          ),
        ),

        // Status
        h(View, { style: s.statusWrapper },
          h(View, { style: [s.statusBadge, { backgroundColor: isPaid ? LIGHT_GREEN : LIGHT_ORANGE }] },
            h(Text, { style: [s.statusText, { color: isPaid ? GREEN : ORANGE }] },
              isPaid
                ? `Payé le ${fmtDate(data.payment_date)}`
                : "En attente de paiement",
            ),
          ),
        ),
      ),

      // ── Footer
      h(View, { style: s.footer, fixed: true },
        h(Text, { style: s.footerText }, `${CLINIC.name} · ${CLINIC.address}`),
        h(Text, { style: s.footerText,
          render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `MedFlow · Page ${pageNumber} / ${totalPages}`,
        }),
      ),
    ),
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const paymentId = Number(id);

  if (isNaN(paymentId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      patient: true,
      appointment: { include: { doctor: true } },
      bills: { include: { service: true }, orderBy: { service_date: "asc" } },
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }

  // Load real React (bypass Next.js RSC vendoring via webpackIgnore)
  // The RSC layer aliases react/jsx-runtime to a version using Symbol(react.transitional.element)
  // which @react-pdf/reconciler does not recognise — webpackIgnore forces the real module.
  const reactReal = await import(/* webpackIgnore: true */ "react") as { default?: { createElement: Function }; createElement?: Function };
  const h = (reactReal.createElement ?? reactReal.default?.createElement) as H;

  const pdfLib = await import("@react-pdf/renderer") as unknown as Record<string, unknown>;
  const { renderToBuffer } = pdfLib as { renderToBuffer: (el: unknown) => Promise<Buffer> };

  const data = payment as FactureData;
  const element = buildDocument(h, pdfLib, data);

  const patientSlug = `${data.patient.last_name}_${data.patient.first_name}`.replace(/\s+/g, "_");
  const num = invoiceNum(data);
  const filename = `MedFlow_Facture_${num}_${patientSlug}.pdf`;

  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
