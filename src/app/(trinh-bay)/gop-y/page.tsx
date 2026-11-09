import type { Metadata } from "next";
import { FeedbackForm } from "@/components/FeedbackForm";

export const metadata: Metadata = { title: "Góp ý" };

export default function FeedbackPage() {
  return (
    <section className="pr-section pr-narrow">
      <h1 className="pr-page-title">Góp ý xây dựng phần mềm</h1>
      <p className="pr-sub">Khoảng 3 phút.</p>
      <FeedbackForm />
    </section>
  );
}
