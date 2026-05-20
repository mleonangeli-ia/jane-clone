"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  serviceId: string;
  currentFormId: string | null;
  availableForms: { id: string; name: string }[];
};

export function ServiceIntakeAssociation({ serviceId, currentFormId, availableForms }: Props) {
  const router = useRouter();
  const [selectedFormId, setSelectedFormId] = useState(currentFormId ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intakeFormId: selectedFormId || null }),
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <p className="mb-2 text-xs font-medium text-gray-500">Intake Form</p>
      <div className="flex items-center gap-2">
        <select
          value={selectedFormId}
          onChange={(e) => setSelectedFormId(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Sin formulario</option>
          {availableForms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
