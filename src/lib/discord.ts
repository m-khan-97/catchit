import "server-only";
import { CATEGORY_LABELS, type Opportunity } from "@/lib/supabase/types";
import { formatDeadlineFull } from "@/lib/opportunities/format";

const ACCENT_COLOR = 0xc7f04a;
// Discord hard-caps embeds per message at 10.
const MAX_EMBEDS_PER_MESSAGE = 10;

function buildEmbed(opportunity: Opportunity) {
  const fields = [
    { name: "Category", value: CATEGORY_LABELS[opportunity.category], inline: true },
    { name: "Deadline", value: formatDeadlineFull(opportunity.deadline), inline: true },
  ];
  if (opportunity.region_tags.length > 0) {
    fields.push({ name: "Region", value: opportunity.region_tags.join(", "), inline: true });
  }

  return {
    title: opportunity.title,
    url: opportunity.url,
    description: opportunity.snippet,
    color: ACCENT_COLOR,
    fields,
    footer: { text: `${opportunity.organization} · CatchIt` },
  };
}

async function postEmbeds(webhookUrl: string, embeds: ReturnType<typeof buildEmbed>[]): Promise<void> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds }),
    });
    if (!res.ok) {
      console.error(`Discord webhook failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error("Discord webhook request failed:", err);
  }
}

/**
 * Posts a formatted embed to the Discord webhook when an opportunity is
 * approved. Deliberately never throws — a notification failing shouldn't
 * undo or block an approval that already succeeded in the database.
 */
export async function sendApprovalNotification(opportunity: Opportunity): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;
  await postEmbeds(webhookUrl, [buildEmbed(opportunity)]);
}

/**
 * Same as sendApprovalNotification, but for a bulk-approve batch: chunks
 * into groups of 10 (Discord's per-message embed limit) and posts them
 * sequentially rather than one message per item, so approving dozens of
 * opportunities at once doesn't spam the channel or trip the webhook's
 * rate limit.
 */
export async function sendBulkApprovalNotifications(opportunities: Opportunity[]): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || opportunities.length === 0) return;

  for (let i = 0; i < opportunities.length; i += MAX_EMBEDS_PER_MESSAGE) {
    const batch = opportunities.slice(i, i + MAX_EMBEDS_PER_MESSAGE);
    await postEmbeds(webhookUrl, batch.map(buildEmbed));
  }
}
