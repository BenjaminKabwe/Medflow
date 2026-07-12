"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  XCircle,
  PackageCheck,
  CheckCircle2,
} from "lucide-react";
import {
  receivePurchaseOrder,
  updatePurchaseOrderStatus,
} from "@/app/actions/pharmacy";
import { formatNumber } from "@/utils";
import { getPoStatusMeta } from "@/components/pharmacy/purchase-order-status";
import { useLanguage } from "@/components/providers";

const STR = {
  fr: {
    error: "Une erreur est survenue.",
    atLeastOneQty: "Indique au moins une quantité reçue.",
    confirmCancel: "Annuler définitivement cette commande ?",
    receiveOver: (name: string, r: number, rem: number) =>
      `${name} : réception (${r}) > restant (${rem}).`,
    batchReq: (name: string) => `${name} : n° de lot requis.`,
    expiryReq: (name: string) => `${name} : date de péremption requise.`,
    statusLabel: "Statut :",
    placeOrder: "Passer la commande",
    cancel: "Annuler",
    medication: "Médicament",
    ordered: "Commandé",
    received: "Reçu",
    unitCost: "Coût unit.",
    total: "Total",
    totalAmount: "Montant total",
    receiveGoods: "Réceptionner la marchandise",
    receiveHelp:
      "Saisis la quantité reçue, le n° de lot, la péremption et le prix de vente. Le stock est mis à jour automatiquement.",
    remaining: "restant :",
    qtyReceived: "Qté reçue",
    batch: "N° de lot",
    batchPh: "ex : LOT-2026-A",
    expiry: "Péremption",
    sellingPrice: "Prix de vente",
    saving: "Enregistrement…",
    validateReceive: "Valider la réception",
  },
  en: {
    error: "An error occurred.",
    atLeastOneQty: "Enter at least one received quantity.",
    confirmCancel: "Permanently cancel this order?",
    receiveOver: (name: string, r: number, rem: number) =>
      `${name}: received (${r}) > remaining (${rem}).`,
    batchReq: (name: string) => `${name}: batch number required.`,
    expiryReq: (name: string) => `${name}: expiry date required.`,
    statusLabel: "Status:",
    placeOrder: "Place order",
    cancel: "Cancel",
    medication: "Medication",
    ordered: "Ordered",
    received: "Received",
    unitCost: "Unit cost",
    total: "Total",
    totalAmount: "Total amount",
    receiveGoods: "Receive goods",
    receiveHelp:
      "Enter the received quantity, batch number, expiry and selling price. Stock is updated automatically.",
    remaining: "remaining:",
    qtyReceived: "Qty received",
    batch: "Batch no.",
    batchPh: "e.g. LOT-2026-A",
    expiry: "Expiry",
    sellingPrice: "Selling price",
    saving: "Saving…",
    validateReceive: "Confirm reception",
  },
};

type Item = {
  id: number;
  medicationName: string;
  medicationDosage: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  totalCost: number;
};

type OrderStatus =
  | "DRAFT"
  | "ORDERED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

type ReceiveInput = {
  quantity: number;
  batch: string;
  expiry: string;
  sellingPrice: number;
};

export function PurchaseOrderDetail({
  order,
}: {
  order: {
    id: number;
    reference: string;
    status: OrderStatus;
    supplierName: string;
    totalAmount: number;
    items: Item[];
  };
}) {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = STR[lang];
  const [busy, setBusy] = useState(false);

  const receivable =
    order.status === "ORDERED" || order.status === "PARTIALLY_RECEIVED";
  const canOrder = order.status === "DRAFT";
  const canCancel = order.status === "DRAFT" || order.status === "ORDERED";

  const openItems = useMemo(
    () => order.items.filter((i) => i.quantityReceived < i.quantityOrdered),
    [order.items]
  );

  const [inputs, setInputs] = useState<Record<number, ReceiveInput>>(() => {
    const init: Record<number, ReceiveInput> = {};
    order.items.forEach((i) => {
      init[i.id] = {
        quantity: 0,
        batch: "",
        expiry: "",
        sellingPrice: 0,
      };
    });
    return init;
  });

  function setInput(id: number, patch: Partial<ReceiveInput>) {
    setInputs((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleStatus(status: OrderStatus, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const res = await updatePurchaseOrderStatus(order.id, status);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(t.error);
    } finally {
      setBusy(false);
    }
  }

  async function handleReceive() {
    const items = openItems
      .map((i) => ({ item: i, input: inputs[i.id] }))
      .filter(({ input }) => input.quantity > 0)
      .map(({ item, input }) => ({
        item_id: item.id,
        quantity_received: input.quantity,
        batch_number: input.batch.trim() || undefined,
        expiry_date: input.expiry ? new Date(input.expiry) : undefined,
        selling_price: input.sellingPrice || undefined,
      }));

    if (items.length === 0) {
      toast.error(t.atLeastOneQty);
      return;
    }
    // Validation locale
    for (const it of items) {
      const openItem = openItems.find((o) => o.id === it.item_id)!;
      const remaining = openItem.quantityOrdered - openItem.quantityReceived;
      if (it.quantity_received > remaining) {
        toast.error(
          t.receiveOver(openItem.medicationName, it.quantity_received, remaining)
        );
        return;
      }
      if (!it.batch_number) {
        toast.error(t.batchReq(openItem.medicationName));
        return;
      }
      if (!it.expiry_date) {
        toast.error(t.expiryReq(openItem.medicationName));
        return;
      }
    }

    setBusy(true);
    try {
      const res = await receivePurchaseOrder({ order_id: order.id, items });
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(t.error);
    } finally {
      setBusy(false);
    }
  }

  const meta = getPoStatusMeta(lang)[order.status];

  return (
    <div className="flex flex-col gap-5">
      {/* Barre d'actions selon statut */}
      <div className="flex items-center justify-between gap-3 flex-wrap rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{t.statusLabel}</span>
          <span
            className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${meta.badge}`}
          >
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canOrder && (
            <button
              type="button"
              disabled={busy}
              onClick={() => handleStatus("ORDERED")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> {t.placeOrder}
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                handleStatus("CANCELLED", t.confirmCancel)
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> {t.cancel}
            </button>
          )}
        </div>
      </div>

      {/* Lignes */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">{t.medication}</th>
                <th className="text-center px-4 py-3">{t.ordered}</th>
                <th className="text-center px-4 py-3">{t.received}</th>
                <th className="text-right px-4 py-3">{t.unitCost}</th>
                <th className="text-right px-4 py-3">{t.total}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items.map((i) => {
                const done = i.quantityReceived >= i.quantityOrdered;
                return (
                  <tr key={i.id}>
                    <td className="px-4 py-3">
                      <span className="text-slate-800 dark:text-slate-100 font-medium">
                        {i.medicationName}
                      </span>{" "}
                      <span className="text-xs text-slate-400">
                        {i.medicationDosage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">
                      {i.quantityOrdered}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          done ? "text-emerald-600" : "text-slate-500"
                        }`}
                      >
                        {done && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {i.quantityReceived}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                      {formatNumber(i.unitCost)} FC
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                      {formatNumber(i.totalCost)} FC
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-100 dark:border-slate-800">
                <td colSpan={4} className="px-4 py-3 text-right text-sm text-slate-500">
                  {t.totalAmount}
                </td>
                <td className="px-4 py-3 text-right text-base font-bold text-slate-800 dark:text-slate-100">
                  {formatNumber(order.totalAmount)} FC
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Réception */}
      {receivable && openItems.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-5">
          <h2 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-2">
            <PackageCheck className="w-4 h-4" /> {t.receiveGoods}
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            {t.receiveHelp}
          </p>

          <div className="space-y-3">
            {openItems.map((i) => {
              const remaining = i.quantityOrdered - i.quantityReceived;
              const inp = inputs[i.id];
              return (
                <div
                  key={i.id}
                  className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {i.medicationName}{" "}
                      <span className="text-xs text-slate-400">
                        {i.medicationDosage}
                      </span>
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {t.remaining} {remaining}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">
                        {t.qtyReceived}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={remaining}
                        value={inp.quantity}
                        onChange={(e) =>
                          setInput(i.id, {
                            quantity: Math.max(
                              0,
                              Math.min(remaining, Number(e.target.value) || 0)
                            ),
                          })
                        }
                        className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">
                        {t.batch}
                      </label>
                      <input
                        type="text"
                        value={inp.batch}
                        onChange={(e) => setInput(i.id, { batch: e.target.value })}
                        placeholder={t.batchPh}
                        className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">
                        {t.expiry}
                      </label>
                      <input
                        type="date"
                        value={inp.expiry}
                        onChange={(e) => setInput(i.id, { expiry: e.target.value })}
                        className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">
                        {t.sellingPrice}
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={inp.sellingPrice}
                        onChange={(e) =>
                          setInput(i.id, {
                            sellingPrice: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="mt-0.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="button"
              disabled={busy}
              onClick={handleReceive}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {t.saving}
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" /> {t.validateReceive}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
