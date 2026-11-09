"use client";

import { useSyncExternalStore } from "react";
import { INDUSTRIES, findIndustry, type IndustryId, type IndustryPack } from "@/config/industries";
import { TENANT } from "@/config/tenant";

const STORAGE_KEY = "ecotech2a-industry";
const CHANGE_EVENT = "ecotech2a-industry-change";

export const AVAILABLE_INDUSTRIES: readonly IndustryPack[] =
  TENANT.industries === "all" ? INDUSTRIES : INDUSTRIES.filter((pack) => (TENANT.industries as IndustryId[]).includes(pack.id));

function read(): IndustryId {
  try {
    const stored = findIndustry(window.localStorage.getItem(STORAGE_KEY));
    if (stored && AVAILABLE_INDUSTRIES.includes(stored)) return stored.id;
  } catch {
    // Trình duyệt chặn bộ nhớ: dùng ngành mặc định.
  }
  return TENANT.defaultIndustry;
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function setActiveIndustry(id: IndustryId) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Không lưu được thì chỉ mất lựa chọn khi tải lại.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useIndustry(): IndustryId {
  return useSyncExternalStore(subscribe, read, () => TENANT.defaultIndustry);
}
