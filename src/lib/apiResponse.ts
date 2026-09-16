export async function readApiResponse<T extends Record<string, any>>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export function getRequestError(error: unknown): string {
  if (error instanceof TypeError) return "სერვერთან დაკავშირება ვერ მოხერხდა. სცადეთ თავიდან.";
  if (error instanceof Error && error.message) return error.message;
  return "მოთხოვნის შესრულება ვერ მოხერხდა. სცადეთ თავიდან.";
}
