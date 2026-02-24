"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

export default function CreatePredictionPage() {
  const t = useTranslations("predict");
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!session) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-muted">Please login to create a prediction.</p>
        <Link href="/login" className="mt-4 inline-block text-primary hover:underline">
          Log In
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, endDate }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create");
        return;
      }

      const event = await res.json();
      router.push(`/predict/${event.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: "general", label: t("categories.general") },
    { id: "politics", label: t("categories.politics") },
    { id: "sports", label: t("categories.sports") },
    { id: "crypto", label: t("categories.crypto") },
    { id: "entertainment", label: t("categories.entertainment") },
    { id: "technology", label: t("categories.technology") },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/predict"
        className="flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">{t("create")}</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-no/10 px-4 py-2.5 text-sm text-no">{error}</div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("question")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary"
            placeholder={t("questionPlaceholder")}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary resize-none"
            placeholder={t("descriptionPlaceholder")}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("category")}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("endDate")}
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !title || !endDate}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "..." : t("submit")}
        </button>
      </form>
    </div>
  );
}
