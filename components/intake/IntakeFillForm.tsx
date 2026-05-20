"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type IntakeField = {
  id: string;
  label: string;
  type: string;
  options: string | null;
  required: boolean;
  position: number;
};

type Props = {
  responseId: string;
  token: string;
  form: {
    name: string;
    description?: string | null;
    fields: IntakeField[];
  };
  professional: string;
  serviceName: string;
};

export function IntakeFillForm({ responseId, token, form, professional, serviceName }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setValue(fieldId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/intake/${responseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          answers: form.fields.map((f) => ({
            fieldId: f.id,
            value: answers[f.id] ?? "",
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al enviar");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el formulario");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">¡Listo!</h2>
        <p className="mt-2 text-gray-500">Tu formulario fue enviado correctamente.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {form.description && (
        <p className="text-sm text-gray-600">{form.description}</p>
      )}

      <div className="space-y-4">
        {form.fields.map((field) => (
          <div key={field.id}>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </label>

            {field.type === "TEXT" && (
              <Input
                value={answers[field.id] ?? ""}
                onChange={(e) => setValue(field.id, e.target.value)}
                required={field.required}
              />
            )}

            {field.type === "TEXTAREA" && (
              <textarea
                value={answers[field.id] ?? ""}
                onChange={(e) => setValue(field.id, e.target.value)}
                required={field.required}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}

            {field.type === "SELECT" && (
              <select
                value={answers[field.id] ?? ""}
                onChange={(e) => setValue(field.id, e.target.value)}
                required={field.required}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Seleccioná una opción</option>
                {(() => {
                  try {
                    const opts = JSON.parse(field.options ?? "[]");
                    return Array.isArray(opts)
                      ? opts.map((o: string) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))
                      : null;
                  } catch {
                    return null;
                  }
                })()}
              </select>
            )}

            {field.type === "CHECKBOX" && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={field.id}
                  checked={answers[field.id] === "true"}
                  onChange={(e) => setValue(field.id, e.target.checked ? "true" : "false")}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <label htmlFor={field.id} className="text-sm text-gray-600">
                  {field.label}
                </label>
              </div>
            )}

            {field.type === "DATE" && (
              <input
                type="date"
                value={answers[field.id] ?? ""}
                onChange={(e) => setValue(field.id, e.target.value)}
                required={field.required}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Enviando..." : "Enviar formulario"}
      </Button>
    </form>
  );
}
