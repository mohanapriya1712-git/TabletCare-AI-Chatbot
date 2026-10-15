export interface Medicine {
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

export type QueryClassification =
  | "ALLOWED_MEDICINE_QUERY"
  | "UNSUPPORTED_MEDICINE_QUERY"
  | "OUT_OF_DOMAIN_QUERY";

export interface ChatResponse {
  classification: QueryClassification;
  message: string;
  medicine: Medicine | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  medicine?: Medicine | null;
  classification?: QueryClassification;
  isLoading?: boolean;
  isError?: boolean;
}
