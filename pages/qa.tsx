// pages/qa.tsx
"use client";

import { useState, FormEvent } from "react";
import Layout from "@/components/Layout";
import useTranslation from "next-translate/useTranslation";

interface Faq {
  id: string;
  question: string;
  answer?: string | null;
}

export default function QaPage() {
  const { t } = useTranslation("common");

  // State for new question input
  const [newQ, setNewQ] = useState("");
  const [loading, setLoading] = useState(false);

  // Static list of FAQs
  const staticFaqs: Faq[] = [
    {
      id: "1",
      question: t("faq1.question"),
      answer: t("faq1.answer"),
    },
    // Add more items or load from your API as needed
  ];

  // Submit a new question to your API
  const submitQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!newQ.trim()) return;
    setLoading(true);

    const res = await fetch("/api/faqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: newQ }),
    });

    if (!res.ok) {
      alert(t("qaSentError"));
    } else {
      setNewQ("");
      alert(t("qaSentSuccess"));
    }

    setLoading(false);
  };

  return (
    <Layout title={t("qaTitle")}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pb-28 md:pb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("qaTitle")}</h1>

        {/* New question form */}
        <form onSubmit={submitQuestion} className="mb-10">
          <textarea
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            placeholder={t("qaPlaceholder")}
            className="w-full border border-gray-300 p-3 rounded-lg mb-3 text-base"
            rows={5}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? t("qaSubmitting") : t("qaSubmit")}
          </button>
        </form>

        {/* FAQ list */}
        <h2 className="text-2xl font-semibold mb-4">{t("qaFaqHeading")}</h2>
        <div className="space-y-4">
          {staticFaqs.map((f) => (
            <div key={f.id} className="border border-gray-200 p-5 rounded-xl bg-white">
              <p className="font-medium text-lg">Q: {f.question}</p>
              <p className="mt-2 text-base">A: {f.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
