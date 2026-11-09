"use client";

import Link from "next/link";
import { Fragment } from "react";
import { getIndustry } from "@/config/industries";
import { AVAILABLE_INDUSTRIES, setActiveIndustry, useIndustry } from "@/lib/useIndustry";

/** Quy trình từng nhóm ngành; chọn nhóm ở đây cũng đổi nhóm của bản demo. */
export function IndustryExplorer() {
  const pack = getIndustry(useIndustry());
  return (
    <>
      <div className="pr-tabs" role="group" aria-label="Nhóm ngành">
        {AVAILABLE_INDUSTRIES.map((item) => (
          <button key={item.id} type="button" aria-pressed={item.id === pack.id} onClick={() => setActiveIndustry(item.id)}>
            <i className={`fa ${item.icon}`} />
            {item.short}
          </button>
        ))}
      </div>

      <h3 className="pr-group-title">{`Nhóm ${pack.group}: ${pack.name}`}</h3>
      <ol className="pr-process">
        {pack.process.map((step, index) => (
          <Fragment key={step.name}>
            <li className={step.trace ? "is-trace" : ""}>
              <b>{index + 1}</b>
              <strong>{step.name}</strong>
              <span>{step.record}</span>
            </li>
          </Fragment>
        ))}
      </ol>
      <p className="pr-legend">Viền cam: bước phải ghi mã lô và dữ liệu nguồn</p>

      <div className="pr-two">
        <div className="pr-card">
          <h4 className="pr-ok">Điểm kiểm soát EUDR</h4>
          <ul>{pack.controls.map((text) => <li key={text}>{text}</li>)}</ul>
        </div>
        <div className="pr-card">
          <h4 className="pr-bad">Điểm dễ mất dấu</h4>
          <ul>{pack.risks.map((text) => <li key={text}>{text}</li>)}</ul>
        </div>
      </div>

      <div className="pr-foot">
        <div className="pr-hs">
          {pack.hs.map((line) => (
            <span key={line.code}><b>HS {line.code}</b> {line.desc}</span>
          ))}
        </div>
        <Link className="pr-cta" href="/nha-may/nhat-ky-san-xuat">
          Xem demo nhóm này<i className="fa fa-arrow-right" />
        </Link>
      </div>
    </>
  );
}
