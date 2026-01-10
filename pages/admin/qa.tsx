// pages/admin/qa.tsx

import { GetServerSideProps } from "next";
import Layout from "@/components/AdminLayout";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { useState } from "react";
import { parseCookies } from "nookies";
import { verify } from "jsonwebtoken";

interface Faq {
  id: string;
  question: string;
  answer?: string | null;
  createdAt: string; // serialized as ISO string
}

interface Props {
  faqs: Faq[];
}

export default function AdminQaPage({ faqs }: Props) {
  const [list, setList] = useState(faqs);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const submitAnswer = async (id: string, ans: string) => {
    if (!ans.trim()) {
      alert("กรุณากรอกคำตอบ");
      return;
    }
    const res = await fetch(`/api/faqs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: ans }),
    });
    if (!res.ok) {
      alert("เกิดข้อผิดพลาดในการบันทึก");
      return;
    }
    setList((prev) =>
      prev.map((f) => (f.id === id ? { ...f, answer: ans } : f))
    );
    setEditing((e) => ({ ...e, [id]: "" }));
  };

  return (
    <Layout title="จัดการคำถาม (Admin)">
      <h1 className="text-3xl font-bold mb-4">จัดการคำถาม (Admin)</h1>
      <Link href="/" className="text-blue-600 mb-4 block">
        &larr; กลับหน้าหลัก
      </Link>
      <div className="space-y-6">
        {list.map((f) => (
          <div key={f.id} className="border p-4 rounded">
            <p className="text-sm text-gray-500 mb-1">
              วันที่: {new Date(f.createdAt).toLocaleString("th-TH")}
            </p>
            <p className="font-medium">Q: {f.question}</p>
            {f.answer ? (
              <p className="mt-2">A: {f.answer}</p>
            ) : (
              <>
                <textarea
                  value={editing[f.id] || ""}
                  onChange={(e) =>
                    setEditing((e0) => ({ ...e0, [f.id]: e.target.value }))
                  }
                  placeholder="พิมพ์คำตอบที่นี่..."
                  className="w-full border p-2 rounded mb-2"
                  rows={3}
                />
                <button
                  onClick={() => submitAnswer(f.id, editing[f.id] || "")}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  บันทึกคำตอบ
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}

/**
 * Only allow ADMIN users:
 *  - checks for a JWT in cookies
 *  - verifies and confirms role==='ADMIN'
 *  - otherwise redirect to /login
 */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cookies = parseCookies(ctx);
  const token = cookies.token;

  if (!token) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  let payload: any;
  try {
    payload = verify(token, process.env.JWT_SECRET!);
  } catch {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  if (payload.role !== "ADMIN") {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  // Fetch all FAQs together with their translations
  const raw = await prisma.faq.findMany({
    include: { translations: true },
    orderBy: { createdAt: "desc" },
  });

  // Map into the shape we need, picking the Thai locale entry
  const faqs: Faq[] = raw.map((f) => {
    const tr = f.translations.find((t) => t.locale === "th");
    return {
      id: f.id,
      question: tr?.question ?? "",
      answer: tr?.answer ?? null,
      createdAt: f.createdAt.toISOString(),
    };
  });

  return { props: { faqs } };
};
