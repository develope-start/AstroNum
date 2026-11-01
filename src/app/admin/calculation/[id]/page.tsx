"use client";

import { useParams, useSearchParams } from "next/navigation";
import SavedCalculationRoom from "@/components/SavedCalculationRoom";

export default function AdminCalculationPage() {
  const { id } = useParams<{ id: string }>();
  const archived = useSearchParams().get("archived") === "1";
  const endpoint = archived ? `/api/admin/management/trash/calculation/${id}` : `/api/admin/management/calculation/${id}`;
  return <SavedCalculationRoom endpoint={endpoint} returnTo="/admin" />;
}
