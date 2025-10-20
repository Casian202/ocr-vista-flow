export interface Folder {
  id: number;
  name: string;
  description: string | null;
  color: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  document_count: number;
}

export interface FolderCreate {
  name: string;
  description?: string;
  color?: string;
  parent_id?: number;
}

export interface FolderUpdate {
  name?: string;
  description?: string;
  color?: string;
  parent_id?: number;
}
