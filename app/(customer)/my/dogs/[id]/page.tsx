"use client";

import { useParams } from "next/navigation";
import { DogDetailView } from "@/components/customer-views";

export default function MyDogDetailPage() {
  const params = useParams<{ id: string }>();
  return <DogDetailView id={Number(params.id)} />;
}
