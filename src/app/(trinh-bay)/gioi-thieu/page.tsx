import type { Metadata } from "next";
import Link from "next/link";
import { IndustryExplorer } from "@/components/IndustryExplorer";
import {
  ARTICLE9, CHAIN, COUNTRY_RISK, EUDR_CONDITIONS, EUDR_DEADLINES, GEO_RULES, HERO_STATS, INHERITED, LAYERS, LEGAL_NOTE,
  MODULES, NOT_INHERITED, PENALTIES, PILLARS, ROADMAP, ROLES, SOFTWARE_FLOW, SOURCES, START_SMALL,
} from "@/config/product";

export const metadata: Metadata = { title: "Giới thiệu" };

function Section({ id, kicker, title, children, tone }: { id?: string; kicker: string; title: string; children: React.ReactNode; tone?: "alt" }) {
  return (
    <section id={id} className={`pr-band ${tone === "alt" ? "pr-alt" : ""}`}>
      <div className="pr-section">
        <p className="pr-kicker">{kicker}</p>
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export default function IntroPage() {
  return (
    <>
      <section className="pr-hero">
        <p className="pr-kicker pr-light">ECOTECH 2A · EUDR ngành gỗ</p>
        <h1>Một phần mềm EUDR cho mọi sản phẩm gỗ</h1>
        <p>Từ lô đất đến đơn hàng EU. Một lõi chung, cấu hình theo từng nhóm ngành.</p>
        <div className="pr-stats">
          {HERO_STATS.map((s) => (
            <div key={s.label}><b>{s.value}</b><span>{s.label}</span></div>
          ))}
        </div>
        <div className="pr-hero-cta">
          <Link className="pr-cta" href="/portal">Xem demo<i className="fa fa-arrow-right" /></Link>
          <a className="pr-ghost" href="#nhom-nganh">5 nhóm ngành</a>
        </div>
      </section>

      <Section kicker="01 · Quy định" title="EUDR yêu cầu gì">
        <div className="pr-three">
          {EUDR_CONDITIONS.map((item) => (
            <div className="pr-card pr-center" key={item.title}>
              <i className={`fa ${item.icon} pr-icon`} />
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
        <div className="pr-timeline">
          {EUDR_DEADLINES.map((item) => (
            <div key={item.date}><b>{item.date}</b><span>{item.who}</span></div>
          ))}
        </div>
      </Section>

      <Section kicker="02 · Trách nhiệm" title="Ai làm gì trong chuỗi" tone="alt">
        <div className="pr-three">
          {ROLES.map((r) => (
            <div className="pr-card" key={r.who}>
              <i className={`fa ${r.icon} pr-icon`} />
              <h3>{r.who}</h3>
              <p>{r.duty}</p>
            </div>
          ))}
        </div>
        <p className="pr-banner">Doanh nghiệp không đưa đủ dữ liệu thì nhà nhập khẩu không được bán hàng tại EU.</p>
      </Section>

      <Section kicker="03 · Dữ liệu" title="8 nhóm dữ liệu bắt buộc mỗi lô">
        <ol className="pr-grid8">
          {ARTICLE9.map((text, i) => (
            <li key={text}><b>{i + 1}</b>{text}</li>
          ))}
        </ol>
        <h3 className="pr-sub-title">Quy tắc tọa độ</h3>
        <div className="pr-four">
          {GEO_RULES.map((g) => (
            <div className="pr-card pr-center" key={g.title}><h3>{g.title}</h3><p>{g.note}</p></div>
          ))}
        </div>
      </Section>

      <Section kicker="04 · Rủi ro" title="Mức rủi ro quốc gia và chế tài" tone="alt">
        <div className="pr-three">
          {COUNTRY_RISK.map((c) => (
            <div className={`pr-card pr-risk pr-risk-${c.tone}`} key={c.level}>
              <span className="pr-tag">Rủi ro {c.level}</span>
              <h3>{c.where}</h3>
              <p>EU kiểm tra khoảng <b>{c.check}</b> lô</p>
            </div>
          ))}
        </div>
        <div className="pr-four pr-penalty">
          {PENALTIES.map((p) => (
            <div key={p.value}><b>{p.value}</b><span>{p.note}</span></div>
          ))}
        </div>
      </Section>

      <Section kicker="05 · Chuỗi chung" title="Mọi nhóm ngành đi qua 6 mắt xích">
        <ol className="pr-chain">
          {CHAIN.map((item) => (
            <li key={item.name}><i className={`fa ${item.icon}`} />{item.name}</li>
          ))}
        </ol>
      </Section>

      <Section id="nhom-nganh" kicker="06 · Nhóm ngành" title="Năm nhóm ngành, một lõi" tone="alt">
        <IndustryExplorer />
      </Section>

      <Section kicker="07 · Nguyên liệu" title="Ba nguồn nguyên liệu, ba bộ hồ sơ">
        <div className="pr-three">
          {SOURCES.map((s) => (
            <div className="pr-card pr-source" key={s.name}>
              <h3>{s.name}</h3>
              <p>{s.docs}</p>
              <span className="pr-risk-note"><i className="fa fa-triangle-exclamation" />{s.risk}</span>
            </div>
          ))}
        </div>
        <p className="pr-banner">Mỗi lô nhập kho gắn đúng một nguồn, vì hồ sơ và cách chấm Đạt khác nhau.</p>
      </Section>

      <Section kicker="08 · Tiếp nhận" title="Ba trụ cột sửa điểm nghẽn tiếp nhận" tone="alt">
        <div className="pr-three">
          {PILLARS.map((pillar, index) => (
            <div className="pr-card" key={pillar.title}>
              <b className="pr-num">{index + 1}</b>
              <h3>{pillar.title}</h3>
              <p>{pillar.note}</p>
            </div>
          ))}
        </div>
        <p className="pr-banner">{START_SMALL}</p>
      </Section>

      <Section kicker="09 · Phần mềm" title="Phần mềm làm gì">
        <ol className="pr-flow">
          {SOFTWARE_FLOW.map((s, i) => (
            <li key={s.title}><i className={`fa ${s.icon}`} /><b>{`${i + 1}. ${s.title}`}</b><span>{s.note}</span></li>
          ))}
        </ol>
        <div className="pr-three pr-modules">
          {MODULES.map((m) => (
            <div className="pr-card" key={m.name}>
              <h3><i className={`fa ${m.icon}`} />{m.name}</h3>
              <ul>{m.items.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          ))}
        </div>
      </Section>

      <Section kicker="10 · Kiến trúc" title="Dùng chung và làm riêng" tone="alt">
        <div className="pr-three">
          {LAYERS.map((layer) => (
            <div className={`pr-card pr-layer pr-${layer.tone}`} key={layer.title}>
              <span className="pr-tag">{layer.tag}</span>
              <h3>{layer.title}</h3>
              <p>{layer.note}</p>
              <ul>{layer.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
        <h3 className="pr-sub-title">Kế thừa từ hệ thống EUDR cao su</h3>
        <div className="pr-inherit">
          {INHERITED.map((row) => (
            <div key={row.wood}><span>{row.rubber}</span><i className="fa fa-arrow-right" /><b>{row.wood}</b></div>
          ))}
        </div>
        <p className="pr-legend">{NOT_INHERITED}</p>
      </Section>

      <Section kicker="11 · Triển khai" title="Lộ trình 90 ngày">
        <ol className="pr-road">
          {ROADMAP.map((r) => (
            <li key={r.phase}><span>{r.phase}</span><h3>{r.title}</h3><p>{r.note}</p></li>
          ))}
        </ol>
      </Section>

      <section className="pr-end">
        <h2>Sẵn sàng trước 30/12/2026</h2>
        <Link className="pr-cta" href="/portal">Xem demo<i className="fa fa-arrow-right" /></Link>
        <p className="pr-legal">{LEGAL_NOTE}</p>
      </section>
    </>
  );
}
