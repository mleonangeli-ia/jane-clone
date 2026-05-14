"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X } from "lucide-react";

export function ServiceForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        description: data.get("description"),
        duration: Number(data.get("duration")),
        price: Math.round(Number(data.get("price")) * 100),
        color: data.get("color"),
      }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Error al guardar");
      setLoading(false);
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Nuevo servicio
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-gray-900">Nuevo servicio</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button>
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre del servicio</Label>
              <Input id="name" name="name" required placeholder="Masaje descontracturante" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input id="description" name="description" placeholder="Breve descripción..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="duration">Duración (min)</Label>
                <Input id="duration" name="duration" type="number" required min={15} step={15} defaultValue={60} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Precio ($)</Label>
                <Input id="price" name="price" type="number" required min={0} step={0.01} defaultValue={0} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="color">Color</Label>
              <input id="color" name="color" type="color" defaultValue="#4F46E5" className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 p-1" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <Button variant="outline" type="button">Cancelar</Button>
              </Dialog.Close>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar servicio"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
