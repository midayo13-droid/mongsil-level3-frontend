"use client";

import { Suspense } from "react";
import { StatsView } from "@/components/stats-views";

export default function StatsPage() {
  return (
    <Suspense fallback={null}>
      <StatsView />
    </Suspense>
  );
}
