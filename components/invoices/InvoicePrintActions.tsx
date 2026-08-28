"use client";

import Link from "next/link";

export function InvoicePrintActions() {
  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2 print:hidden">
      <Link
        href="/dashboard/invoices"
        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50"
      >
        ← Volver
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800"
      >
        Imprimir / PDF
      </button>
    </div>
  );
}
