"use client";

import { useParams } from "next/navigation";
import { DogEditView } from "@/components/edit-views";

export default function StaffDogEditPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  return <DogEditView dogId={id} backHref={`/dogs/${id}`} />;
}
