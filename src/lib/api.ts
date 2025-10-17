const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_BASE_URL =
  RAW_API_BASE_URL === "/"
    ? ""
    : RAW_API_BASE_URL.replace(/\/+$/, "");

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "A apărut o eroare neașteptată");
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function getJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  return handleResponse<T>(response);
}

export async function deleteRequest(path: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE" });
  await handleResponse<void>(response);
}

export async function patchJSON<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function postFormData<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<T>(response);
}

export function buildApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
