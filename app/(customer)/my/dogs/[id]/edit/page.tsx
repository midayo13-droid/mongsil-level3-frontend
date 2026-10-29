"use client";

import { useParams } from "next/navigation";
import { DogFormView } from "@/components/customer-views";

export default function EditMyDogPage() {
  const params = useParams<{ id: string }>();
  return <DogFormView id={Number(params.id)} />;
}
