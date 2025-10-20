export interface WordDocument {
  id: number;
  title: string;
  source: string;
  original_filename?: string | null;
  file_name: string;
  mime_type: string;
  summary?: string | null;
  created_at: string;
  download_url: string;
  folder_id?: number | null;
}
