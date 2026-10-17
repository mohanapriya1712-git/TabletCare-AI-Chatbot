// TabletCare AI — Backend validation & medicine retrieval edge function.
// Receives a user query, classifies it, validates against the curated
// medicines table, and returns a structured response. Never exposes
// API keys or system prompts to the client.

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MedicineRow {
  id: string;
  name: string;
  active_ingredient: string;
  common_uses: string[];
  side_effects: string[];
  precautions: string[];
  important_warnings: string[];
  image_url: string | null;
  source: string;
  aliases: string[];
}

interface ValidatedResponse {
  classification:
    | "ALLOWED_MEDICINE_QUERY"
    | "UNSUPPORTED_MEDICINE_QUERY"
    | "OUT_OF_DOMAIN_QUERY";
  message: string;
  medicine: MedicineRow | null;
}

// ---------------------------------------------------------------------------
// Domain classification
// ---------------------------------------------------------------------------

const OUT_OF_DOMAIN_PATTERNS = [
  // Programming / code
  /\b(python|java|javascript|c\+\+|ruby|php|swift|kotlin|go\b|rust|html|css|sql|code|coding|program|programming|algorithm|script|debug|compile|software)\b/i,
  // Sports & entertainment
  /\b(cricket|football|soccer|tennis|basketball|baseball|hockey|golf|rugby|olympic|movie|film|cinema|actor|actress|music|song|album|concert|video\s?game|gaming)\b/i,
  // Politics / general knowledge
  /\b(politic|election|president|prime\sminister|government|war|geography|capital\sof|general\sknowledge|trivia|quiz)\b/i,
  // Prompt injection attempts
  /\b(ignore\syour\srules|ignore\sthe\s(rules|system|instructions)|forget\syour\s(rules|instructions|prompt)|reveal\syour\s(prompt|instructions|system)|show\syour\s(prompt|instructions)|bypass|override\syour|act\sas\sif|pretend\syou\sare|you\sare\snow|new\sinstructions|disregard)\b/i,
  // Other non-medical domains
  /\b(recipe|cook|baking|travel|tourism|hotel|flight|weather|stock\s?market|cryptocurrency|bitcoin|finance|investment|relationship|dating|joke|story|poem|essay|homework|math|physics|chemistry\squestion|biology\squestion)\b/i,
];

const MEDICINE_DOMAIN_KEYWORDS = [
  "tablet", "tablets", "medicine", "medicines", "medication", "medications",
  "drug", "drugs", "pill", "pills", "capsule", "capsules", "dose", "dosage",
  "side effect", "side effects", "uses", "used for", "what is",
  "active ingredient", "precaution", "precautions", "contraindication",
  "interaction", "interactions", "safe", "safety", "prescription",
  "over the counter", "otc", "antibiotic", "antibiotics", "painkiller",
  "pain relief", "antihistamine", "antacid", "anti-inflammatory",
  "generic", "brand name", "formulation", "syrup", "injection", "cream",
  "ointment", "allergic", "allergy", "fever", "headache", "infection",
  "ingredient", "pharmaceutical", "pharma", "medicinal", "explain",
  "symptoms", "symptom", "treats", "treat", "treatment", "cure", "cures",
  "relief", "relieve", "condition", "conditions", "indication", "indications",
];

const INJECTION_DISGUISE_PATTERNS = [
  /\b(tablet|medicine|medication|pill|drug)\b.*\b(python|java|code|program|script|cricket|football|movie|music|joke|story|recipe)\b/i,
  /\b(python|java|code|program|script|cricket|football|movie|music|joke|story|recipe)\b.*\b(tablet|medicine|medication|pill|drug)\b/i,
];

function containsOutOfDomain(text: string): boolean {
  return OUT_OF_DOMAIN_PATTERNS.some((p) => p.test(text));
}

function containsInjectionDisguise(text: string): boolean {
  return INJECTION_DISGUISE_PATTERNS.some((p) => p.test(text));
}

function hasMedicineDomainSignal(text: string): boolean {
  const lower = text.toLowerCase();
  return MEDICINE_DOMAIN_KEYWORDS.some((kw) => lower.includes(kw));
}

function hasMixedContent(text: string): boolean {
  return hasMedicineDomainSignal(text) && containsOutOfDomain(text);
}

// ---------------------------------------------------------------------------
// Medicine name extraction
// ---------------------------------------------------------------------------

// Common question phrases and filler words to strip so the medicine name
// can be isolated from the full question text. Ordered longest-first within
// each group so multi-word phrases are removed before shorter ones.
const QUESTION_PHRASES: string[] = [
  "what are the side effects of",
  "what is the side effect of",
  "what are the uses of",
  "what is the use of",
  "what are the precautions of",
  "what are the precautions for",
  "what is",
  "what are",
  "tell me about",
  "tell me the",
  "tell me",
  "explain",
  "uses of",
  "side effects of",
  "precautions of",
  "precautions for",
  "information about",
  "information on",
  "details about",
  "details for",
  "about",
  "used for",
  "tablets",
  "tablet",
  "medicine",
  "medication",
  "drug",
  "pill",
  "capsule",
  "capsules",
];

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Extract a potential medicine name from the query by stripping known
// question phrases and filler words.
function extractMedicineName(query: string): string | null {
  let lower = query.toLowerCase().replace(/[?.]+$/, "").trim();

  for (const phrase of QUESTION_PHRASES) {
    lower = lower.replace(phrase, " ");
  }

  // Remove common filler words
  lower = lower
    .replace(/\bof\b/g, " ")
    .replace(/\bthe\b/g, " ")
    .replace(/\bis\b/g, " ")
    .replace(/\bare\b/g, " ")
    .replace(/\bfor\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (lower.length === 0) return null;
  return lower;
}

// ---------------------------------------------------------------------------
// Supabase client (service role — runs server-side, never exposed to client)
// ---------------------------------------------------------------------------
function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceKey);
}

// ---------------------------------------------------------------------------
// Medicine lookup — fetches all medicines once, then checks whether any
// medicine name or alias appears as a whole word in the query text.
// This is robust against question phrasing like "What are the side effects
// of Cetirizine?" because it searches for the medicine name within the full
// query rather than trying to use the whole question as a lookup key.
// ---------------------------------------------------------------------------
async function findMedicine(
  supabase: ReturnType<typeof getSupabase>,
  query: string
): Promise<MedicineRow | null> {
  const { data: allMeds, error } = await supabase
    .from("medicines")
    .select("*");

  if (error || !allMeds) return null;

  const meds = allMeds as MedicineRow[];
  const queryLower = query.toLowerCase();

  // Sort medicine names by length descending so multi-word names match first
  const sortedMeds = [...meds].sort(
    (a, b) => b.name.length - a.name.length
  );

  // Pass 1: Check each medicine's primary name as a whole-word match
  for (const med of sortedMeds) {
    const regex = new RegExp(`\\b${escapeRegex(med.name)}\\b`, "i");
    if (regex.test(queryLower)) {
      return med;
    }
  }

  // Pass 2: Check aliases (brand names, generic alternatives)
  for (const med of sortedMeds) {
    if (!med.aliases) continue;
    for (const alias of med.aliases) {
      const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
      if (regex.test(queryLower)) {
        return med;
      }
    }
  }

  // Pass 3: Use the extracted name for exact / partial matches as fallback
  const extractedName = extractMedicineName(query);
  if (extractedName) {
    for (const med of sortedMeds) {
      if (med.name.toLowerCase() === extractedName) {
        return med;
      }
    }
    for (const med of sortedMeds) {
      const medNameLower = med.name.toLowerCase();
      if (medNameLower.includes(extractedName) || extractedName.includes(medNameLower)) {
        return med;
      }
    }
    for (const med of sortedMeds) {
      if (med.aliases?.some((a) => a.toLowerCase() === extractedName)) {
        return med;
      }
    }
  }

  return null;
}

function buildMedicineSummary(med: MedicineRow): string {
  const usesList = med.common_uses.map((u) => `• ${u}`).join("\n");
  const sideEffectsList = med.side_effects.map((s) => `• ${s}`).join("\n");
  const precautionsList = med.precautions.map((p) => `• ${p}`).join("\n");

  return [
    `Here is verified information about ${med.name} (Active ingredient: ${med.active_ingredient}).`,
    "",
    `Conditions it treats / Common uses:`,
    usesList,
    "",
    `Possible side effects:`,
    sideEffectsList,
    "",
    `Precautions:`,
    precautionsList,
    "",
    `For important warnings and full details, see the information card below. Always consult a doctor or pharmacist for personal medical advice.`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    // Validate input
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({
          classification: "OUT_OF_DOMAIN_QUERY",
          message:
            "Please enter a tablet name or ask a medicine-related question. Your message cannot be empty.",
          medicine: null,
        } satisfies ValidatedResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const trimmedQuery = query.trim();
    const supabase = getSupabase();

    // Step 1: Check for prompt injection disguise attempts
    if (containsInjectionDisguise(trimmedQuery)) {
      const response: ValidatedResponse = {
        classification: "OUT_OF_DOMAIN_QUERY",
        message:
          "I can answer the medicine-related part of your question. However, I'm TabletCare AI and can only help with tablets and medicines. Please ask the non-medicine part elsewhere.",
        medicine: null,
      };
      const med = await findMedicine(supabase, trimmedQuery);
      if (med) {
        response.medicine = med;
        response.message = buildMedicineSummary(med);
        response.classification = "ALLOWED_MEDICINE_QUERY";
      }
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Check for clearly out-of-domain queries
    if (
      containsOutOfDomain(trimmedQuery) &&
      !hasMedicineDomainSignal(trimmedQuery)
    ) {
      const response: ValidatedResponse = {
        classification: "OUT_OF_DOMAIN_QUERY",
        message:
          "I'm TabletCare AI. I can answer only questions related to tablets and medicines. Please ask a medicine-related question.",
        medicine: null,
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Check for mixed content (medicine + non-medicine)
    if (hasMixedContent(trimmedQuery)) {
      const med = await findMedicine(supabase, trimmedQuery);
      if (med) {
        const response: ValidatedResponse = {
          classification: "ALLOWED_MEDICINE_QUERY",
          message:
            buildMedicineSummary(med) +
            "\n\nNote: I could only answer the medicine-related part of your question. The non-medicine part was not answered.",
          medicine: med,
        };
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const response: ValidatedResponse = {
        classification: "OUT_OF_DOMAIN_QUERY",
        message:
          "I'm TabletCare AI. I can answer only questions related to tablets and medicines. Please ask a medicine-related question.",
        medicine: null,
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 4: Query appears to be medicine-related — validate against medicine data
    const medicine = await findMedicine(supabase, trimmedQuery);

    if (medicine) {
      const response: ValidatedResponse = {
        classification: "ALLOWED_MEDICINE_QUERY",
        message: buildMedicineSummary(medicine),
        medicine,
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 5: Query seems medicine-related but no matching medicine found
    if (hasMedicineDomainSignal(trimmedQuery)) {
      const response: ValidatedResponse = {
        classification: "UNSUPPORTED_MEDICINE_QUERY",
        message:
          "I could not reliably identify this medicine in my verified database. Please check the tablet name spelling, provide the active ingredient, or share packaging information so I can look it up more accurately. I do not invent medicine facts.",
        medicine: null,
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 6: Default — treat as out of domain
    const response: ValidatedResponse = {
      classification: "OUT_OF_DOMAIN_QUERY",
      message:
        "I'm TabletCare AI. I can answer only questions related to tablets and medicines. Please ask a medicine-related question.",
      medicine: null,
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({
        classification: "OUT_OF_DOMAIN_QUERY",
        message:
          "I encountered an error while processing your request. Please try again in a moment.",
        medicine: null,
      } satisfies ValidatedResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
