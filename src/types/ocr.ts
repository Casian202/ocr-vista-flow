export type OCRStatus = "queued" | "processing" | "completed" | "failed";

export interface OCRJob {
  id: number;
  original_filename: string;
  engine: string;
  auto_detect: boolean;
  language?: string | null;
  folder?: string | null;
  folder_id?: number | null;
  status: OCRStatus;
  progress: number;
  error?: string | null;
  output_filename?: string | null;
  output_mime_type?: string | null;
  text_excerpt?: string | null;
  summary?: string | null;
  created_at: string;
  updated_at: string;
  download_url?: string | null;
}

export interface OCRJobDetail extends OCRJob {
  options?: Record<string, unknown> | null;
}
