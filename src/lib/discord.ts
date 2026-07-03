import "server-only";
import { CATEGORY_LABELS, type Opportunity } from "@/lib/supabase/types";
import { formatDeadlineFull } from "@/lib/opportunities/format";

const ACCENT_COLOR = 0xc7f04a;

/**
 * Posts a formatted embed to the Discord webhook when an opportunity is
 * approved. Deliberately never throws — a notification failing shouldn't
 * undo or block an approval that already succeeded in the database. Kept
 * as a small standalone helper so it's trivial to also call from the
 * discovery cron job later if the moderation model changes.
 */
export async function sendApprovalNotification(opportunity: Opportunity): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const fields = [
    { name: "Category", value: CATEGORY_LABELS[opportunity.category], inline: true },
    { name: "Deadline", value: formatDeadlineFull(opportunity.deadline), inline: true },
  ];
  if (opportunity.region_tags.length > 0) {
    fields.push({ name: "Region", value: opportunity.region_tags.join(", "), inline: true });
  }

  const payload = {
    embeds: [
      {
        title: opportunity.title,
        url: opportunity.url,
        description: opportunity.snippet,
        color: ACCENT_COLOR,
        fields,
        footer: { text: `${opportunity.organization} · CatchIt` },
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`Discord webhook failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error("Discord webhook request failed:", err);
  }
}
