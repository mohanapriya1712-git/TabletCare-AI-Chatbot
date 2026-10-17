import type { ChatResponse, MedicinePrediction } from "@/types";
import { supabase } from "@/lib/supabase";

const EDGE_FUNCTION_SLUG = "tabletcare-chat";

function getFunctionUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return `${url}/functions/v1/${EDGE_FUNCTION_SLUG}`;
}

function getHeaders(): Record<string, string> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return {
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };
}

export async function sendQuery(query: string): Promise<ChatResponse> {
  const response = await fetch(getFunctionUrl(), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}). Please try again.`);
  }

  const data = (await response.json()) as ChatResponse;

  if (!data.classification || !data.message) {
    throw new Error("Received an unexpected response. Please try again.");
  }

  return data;
}

let cachedPredictions: MedicinePrediction[] | null = null;

export async function fetchMedicinePredictions(): Promise<MedicinePrediction[]> {
  if (cachedPredictions) return cachedPredictions;

  const { data, error } = await supabase
    .from("medicines")
    .select("name, active_ingredient, aliases");

  if (error || !data) return [];

  const predictions: MedicinePrediction[] = [];
  for (const med of data) {
    predictions.push({ name: med.name, active_ingredient: med.active_ingredient });
    if (med.aliases) {
      for (const alias of med.aliases) {
        if (alias.toLowerCase() !== med.name.toLowerCase()) {
          predictions.push({ name: alias, active_ingredient: med.active_ingredient });
        }
      }
    }
  }

  cachedPredictions = predictions;
  return predictions;
}
