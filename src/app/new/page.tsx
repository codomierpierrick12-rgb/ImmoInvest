"use client";
import { useState } from "react";

export default function NewItemPage() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const json = await res.json();
    if (!res.ok) {
      setStatus(`Erreur: ${json.error}`);
      return;
    }
    setStatus("Créé");
    setName("");
  }

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nouvel item</h1>
      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full border rounded p-2"
          placeholder="Nom de l'item"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="px-4 py-2 rounded bg-black text-white">Créer</button>
      </form>
      {status && <p className="mt-4">{status}</p>}
    </main>
  );
}
