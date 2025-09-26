import { supabase } from "@/lib/supabaseClient";

export default async function Home() {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("inserted_at", { ascending: false });

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-xl font-bold">Erreur BDD</h1>
        <pre className="mt-4 p-4 rounded bg-gray-100">{error.message}</pre>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Items</h1>
      <ul className="space-y-2">
        {(data ?? []).map((i) => (
          <li key={i.id} className="rounded border p-3">{i.name}</li>
        ))}
        {(!data || data.length === 0) && (
          <li className="text-gray-500">Aucun item</li>
        )}
      </ul>
    </main>
  );
}
