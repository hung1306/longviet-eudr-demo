"use client";

import type { IndustryId } from "@/config/industries";
import { AVAILABLE_INDUSTRIES, setActiveIndustry, useIndustry } from "@/lib/useIndustry";

/** Bản công ty khóa một ngành thì không cần chọn. */
export function IndustrySelect({ className }: { className?: string }) {
  const industry = useIndustry();
  if (AVAILABLE_INDUSTRIES.length < 2) return null;
  return (
    <select
      className={className}
      aria-label="Nhóm ngành"
      value={industry}
      onChange={(event) => setActiveIndustry(event.target.value as IndustryId)}
    >
      {AVAILABLE_INDUSTRIES.map((pack) => (
        <option key={pack.id} value={pack.id}>
          {`Nhóm ${pack.group}: ${pack.short}`}
        </option>
      ))}
    </select>
  );
}
