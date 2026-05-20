"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Field = {
  id?: string;
  label: string;
  type: string;
  options: string;
  required: boolean;
  position: number;
};

type Props = {
  form: {
    id: string;
    name: string;
    description: string | null;
    fields: {
      id: string;
      label: string;
      type: string;
      options: string | null;
      required: boolean;
      position: number;
    }[];
  };
};

const FIELD_TYPES = [
  { value: "TEXT", label: "Texto corto" },
  { value: "TEXTAREA", label: "Texto largo" },
  { value: "SELECT", label: "Selección" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "DATE", label: "Fecha" },
];

function rawOptionsToText(options: string | null): string {
  if (!options) return "";
  try {
    const parsed = JSON.parse(options);
    if (Array.isArray(parsed)) return parsed.join("\n");
  } catch {
    // not JSON, return as-is
  }
  return options;
}

export function IntakeFormEditor({ form }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(form.name);
  const [description, setDescription] = useState(form.description ?? "");
  const [fields, setFields] = useState<Field[]>(
    form.fields.map((f) => ({
      id: f.id,
      label: f.label,
      type: f.type,
      options: rawOptionsToText(f.options),
      required: f.required,
      position: f.position,
    }))
  );

  function addField() {
    setFields((prev) => [
      ...prev,
      { label: "", type: "TEXT", options: "", required: false, position: prev.length },
    ]);
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function updateField(index: number, patch: Partial<Field>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name,
        description: description || null,
        fields: fields.map((f, i) => ({
          label: f.label,
          type: f.type,
          options:
            f.type === "SELECT" && f.options
              ? JSON.stringify(
                  f.options
                    .split("\n")
                    .map((o) => o.trim())
                    .filter(Boolean)
                )
              : undefined,
          required: f.required,
          position: i,
        })),
      };

      const res = await fetch(`/api/intake-forms/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al guardar");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/intake-forms/${form.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      router.push("/dashboard/intake-forms");
    } catch (err) {
      console.error(err);
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Información del formulario</h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nombre <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Preguntas</h2>
          <button
            type="button"
            onClick={addField}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="h-3 w-3" />
            Agregar pregunta
          </button>
        </div>

        {fields.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">
            Sin preguntas. Agregá una.
          </p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  placeholder="Pregunta"
                  className="flex-1"
                />
                <select
                  value={field.type}
                  onChange={(e) => updateField(index, { type: e.target.value })}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="rounded-md p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`req-${index}`}
                  checked={field.required}
                  onChange={(e) => updateField(index, { required: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <label htmlFor={`req-${index}`} className="text-xs text-gray-600">
                  Requerido
                </label>
              </div>
              {field.type === "SELECT" && (
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Opciones (una por línea)
                  </label>
                  <textarea
                    value={field.options}
                    onChange={(e) => updateField(index, { options: e.target.value })}
                    rows={3}
                    placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-md px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : confirmDelete ? "¿Confirmar eliminación?" : "Eliminar formulario"}
        </button>
        {confirmDelete && !deleting && (
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
