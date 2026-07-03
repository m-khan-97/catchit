import { ImageResponse } from "next/og";
import { getOpportunityById } from "@/lib/supabase/queries";
import { CATEGORY_LABELS } from "@/lib/supabase/types";
import { formatDeadlineFull } from "@/lib/opportunities/format";

export const alt = "Opportunity on CatchIt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CATEGORY_ACCENTS: Record<string, string> = {
  hackathon: "#7C5CFF",
  voucher: "#2F9E5F",
  event: "#E08A2B",
  scholarship: "#3B82D6",
  internship: "#D45C8E",
  conference: "#16A8A0",
  journal: "#C9A227",
  other: "#8A8A7E",
};

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = await getOpportunityById(id);

  const title = opportunity?.title ?? "Opportunity not found";
  const org = opportunity?.organization ?? "CatchIt";
  const deadlineText = opportunity ? formatDeadlineFull(opportunity.deadline) : "";
  const accent = opportunity ? CATEGORY_ACCENTS[opportunity.category] : "#C7F04A";
  const categoryLabel = opportunity ? CATEGORY_LABELS[opportunity.category] : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#0F100C",
          color: "#EDECE2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#26271E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "3px solid #C7F04A",
                display: "flex",
              }}
            />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>CatchIt</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {categoryLabel && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 26,
                fontWeight: 600,
                color: accent,
                marginBottom: 24,
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: accent }} />
              {categoryLabel}
            </div>
          )}
          <div
            style={{
              fontSize: 58,
              fontWeight: 700,
              letterSpacing: -1.5,
              lineHeight: 1.08,
              display: "flex",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 28, color: "#9C9A8A", marginTop: 20, display: "flex" }}>
            {org}
            {deadlineText ? ` · ${deadlineText}` : ""}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
