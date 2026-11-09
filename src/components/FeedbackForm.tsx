"use client";

import { useEffect, useState, type FormEvent } from "react";
import { INDUSTRIES } from "@/config/industries";
import { FEEDBACK_MODULES } from "@/config/product";

const STORAGE_KEY = "ecotech2a-feedback";
const MAX_MODULES = 3;

interface Feedback {
  at: string;
  company: string;
  contact: string;
  phone: string;
  groups: string;
  size: string;
  euShare: string;
  tracking: string;
  pain: string;
  modules: string;
  gap: string;
  deploy: string;
  pilot: string;
}

const COLUMNS: [keyof Feedback, string][] = [
  ["at", "Thời gian"], ["company", "Công ty"], ["contact", "Người liên hệ"], ["phone", "Điện thoại, email"],
  ["groups", "Nhóm ngành"], ["size", "Quy mô"], ["euShare", "Xuất EU"], ["tracking", "Đang quản lý lô bằng"],
  ["pain", "Khó nhất"], ["modules", "Cần nhất"], ["gap", "Công đoạn khác mẫu"], ["deploy", "Hình thức"], ["pilot", "Chạy thử"],
];

/** Chặn công thức khi mở CSV bằng Excel, nội dung do người ngoài nhập. */
function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function toCsv(rows: Feedback[]) {
  const lines = [COLUMNS.map(([, label]) => csvCell(label)).join(",")];
  rows.forEach((row) => lines.push(COLUMNS.map(([key]) => csvCell(row[key])).join(",")));
  return `﻿${lines.join("\r\n")}\r\n`;
}

function loadRows(): Feedback[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Feedback[]) : [];
  } catch {
    return [];
  }
}

function Choice({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <fieldset className="fb-field">
      <legend>{label}</legend>
      <div className="fb-options">
        {options.map((option) => (
          <label key={option}>
            <input type="radio" name={name} value={option} required />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FeedbackForm() {
  const [rows, setRows] = useState<Feedback[]>([]);
  const [saved, setSaved] = useState(false);
  const [modules, setModules] = useState<string[]>([]);

  useEffect(() => {
    // localStorage chỉ có ở trình duyệt nên phải đọc sau khi hydrate.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(loadRows());
  }, []);

  const persist = (next: Feedback[]) => {
    setRows(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Không lưu được thì vẫn còn trong phiên và tải CSV được.
    }
  };

  const toggleModule = (name: string) => {
    setModules((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : current.length < MAX_MODULES ? [...current, name] : current,
    );
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (key: string) => String(data.get(key) ?? "").trim();
    persist([
      ...rows,
      {
        at: new Date().toLocaleString("vi-VN"),
        company: text("company"),
        contact: text("contact"),
        phone: text("phone"),
        groups: data.getAll("groups").join("; "),
        size: text("size"),
        euShare: text("euShare"),
        tracking: text("tracking"),
        pain: text("pain"),
        modules: modules.join("; "),
        gap: text("gap"),
        deploy: text("deploy"),
        pilot: text("pilot"),
      },
    ]);
    form.reset();
    setModules([]);
    setSaved(true);
    window.scrollTo({ top: 0 });
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "gop-y-doanh-nghiep-go.csv";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {saved ? <p className="fb-saved" role="status"><i className="fa fa-circle-check" />Đã lưu. Cảm ơn anh/chị!</p> : null}

      <form className="fb-form" onSubmit={onSubmit} onChange={() => setSaved(false)}>
        <div className="fb-row">
          <label className="fb-field">Công ty<input className="form-control" name="company" required /></label>
          <label className="fb-field">Người liên hệ<input className="form-control" name="contact" /></label>
          <label className="fb-field">Điện thoại, email<input className="form-control" name="phone" /></label>
        </div>

        <fieldset className="fb-field">
          <legend>Nhóm ngành</legend>
          <div className="fb-options">
            {INDUSTRIES.map((pack) => (
              <label key={pack.id}>
                <input type="checkbox" name="groups" value={pack.short} />
                <span>{pack.short}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Choice name="size" label="Quy mô" options={["Siêu nhỏ", "Nhỏ", "Vừa", "Lớn"]} />
        <Choice name="euShare" label="Xuất EU" options={["Chưa có", "Dưới 30%", "Trên 30%"]} />
        <Choice name="tracking" label="Đang quản lý lô bằng" options={["Giấy", "Excel", "Phần mềm", "Chưa quản lý"]} />

        <label className="fb-field">Khó nhất với EUDR hiện nay<textarea className="form-control" name="pain" rows={2} /></label>

        <fieldset className="fb-field">
          <legend>{`Cần nhất (chọn tối đa ${MAX_MODULES})`}</legend>
          <div className="fb-options">
            {FEEDBACK_MODULES.map((name) => (
              <label key={name}>
                <input
                  type="checkbox"
                  checked={modules.includes(name)}
                  disabled={!modules.includes(name) && modules.length >= MAX_MODULES}
                  onChange={() => toggleModule(name)}
                />
                <span>{name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="fb-field">Công đoạn của công ty khác mẫu ở đâu?<textarea className="form-control" name="gap" rows={2} /></label>

        <Choice name="deploy" label="Hình thức mong muốn" options={["Thuê theo tháng", "Cài riêng", "Chưa rõ"]} />
        <Choice name="pilot" label="Chạy thử cùng ECOTECH 2A?" options={["Có", "Cân nhắc", "Chưa"]} />

        <button className="btn btn-primary" type="submit">Gửi góp ý</button>
      </form>

      <section className="fb-list">
        <div className="fb-list-head">
          <h2>{`Đã nhận ${rows.length} góp ý`}</h2>
          <button className="btn btn-sm btn-outline-secondary" type="button" disabled={!rows.length} onClick={download}>
            <i className="fa fa-download me-1" />Tải CSV
          </button>
        </div>
        <p className="fb-note">Lưu trên máy này. Tải CSV sau buổi đào tạo.</p>
        {rows.length ? (
          <ul>
            {rows.map((row, index) => (
              <li key={`${row.at}-${index}`}>
                <b>{row.company}</b>
                <span>{row.groups || "–"}</span>
                <button type="button" aria-label={`Xóa góp ý ${row.company}`} onClick={() => persist(rows.filter((_, i) => i !== index))}>
                  <i className="fa fa-xmark" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </>
  );
}
