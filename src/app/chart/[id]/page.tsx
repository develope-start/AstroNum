"use client";

import { useParams } from "next/navigation";
import SavedCalculationRoom from "@/components/SavedCalculationRoom";

export default function SavedChartPage() {
  const { id } = useParams<{ id: string }>();
  return <SavedCalculationRoom endpoint={`/api/charts/${id}`} returnTo="/cabinet/dashboard" />;
}
