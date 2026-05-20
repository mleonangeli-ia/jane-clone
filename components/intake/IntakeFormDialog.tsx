"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FieldDraft = {
  label: string;
  type: string;
  options: string;
  required: boolean;
};

const FIELD_TYPES = [
  { value: "TEXT", label: "Texto corto" },
  { value: "TEXTAREA", label: "Texto largo" },
  { value: "SELECT", label: "Selección" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "DATE", label: "Fecha" },
];

export function IntakeFormDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FieldDraft[]>([]);

  function addField() {
    setFields((prev) => [
      ...prev,
      { label: "", type: "TEXT", options: "", required: false },
    ]);
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function updateField(index: number, patch: Partial<FieldDraft>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name,
        description: description || undefined,
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

      const res = await fetch("/api/intake-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al crear formulario");

      setOpen(false);
      setName("");
      setDescription("");
      setFields([]);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo formulario
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Nuevo formulario
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-md p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nombre del formulario <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Anamnesis inicial"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción opcional del formulario"
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Preguntas</h3>
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
                <p className="rounded-lg border border-dashed border-gray-200 py-4 text-center text-sm text-gray-400">
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

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear formulario"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
