import type { ChatResponse } from "@/types";

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

export async function fetchSuggestedMedicines(): Promise<string[]> {
  return [
    "What are the uses of Paracetamol?",
    "What are the side effects of Cetirizine?",
    "Tell me about Ibuprofen",
    "What is Aspirin used for?",
    "What are the precautions for Amoxicillin?",
    "Tell me about Omeprazole",
  ];
}
