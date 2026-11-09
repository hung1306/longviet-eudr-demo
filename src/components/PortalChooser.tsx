"use client";

import { AVAILABLE_INDUSTRIES, setActiveIndustry, useIndustry } from "@/lib/useIndustry";

export function PortalChooser() {
  const industry = useIndustry();
  if (AVAILABLE_INDUSTRIES.length < 2) return null;
  return (
    <>
      <h2 className="pxh-title">Chọn nhóm ngành</h2>
      <div className="pxh-industries" role="group" aria-label="Nhóm ngành">
        {AVAILABLE_INDUSTRIES.map((pack) => (
          <button
            key={pack.id}
            type="button"
            className="pxh-chip"
            aria-pressed={pack.id === industry}
            onClick={() => setActiveIndustry(pack.id)}
          >
            <i className={`fa ${pack.icon}`} />
            {pack.short}
          </button>
        ))}
      </div>
    </>
  );
}
