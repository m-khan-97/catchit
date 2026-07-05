import "server-only";
import { CATEGORY_LABELS, type PublicOpportunity } from "@/lib/supabase/types";
import { formatDeadlineFull } from "@/lib/opportunities/format";

// Email clients don't load external CSS, so everything is inlined. The
// palette mirrors the site's dark theme tokens; layout is a single
// 600px column, the one thing every mail client renders consistently.
const COLORS = {
  bg: "#0F100C",
  surface: "#1B1C15",
  ink: "#EDECE2",
  ink2: "#C6C4B4",
  ink3: "#9C9A8A",
  ink4: "#807E6D",
  border: "#2C2D23",
  accent: "#C7F04A",
  accentInk: "#14140E",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shell(bodyHtml: string, footerHtml: string): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding-bottom:24px;">
          <span style="font-size:20px;font-weight:700;color:${COLORS.ink};letter-spacing:-0.02em;">🎯 CatchIt</span>
        </td></tr>
        ${bodyHtml}
        <tr><td style="padding-top:28px;border-top:1px solid ${COLORS.border};font-size:12px;line-height:1.6;color:${COLORS.ink4};">
          ${footerHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function confirmationEmail(confirmUrl: string): { subject: string; html: string } {
  const body = `
    <tr><td style="padding-bottom:8px;">
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:${COLORS.ink};letter-spacing:-0.02em;">One click and you're on the radar</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${COLORS.ink2};">
        Confirm your email to start getting the CatchIt weekly digest — new opportunities and
        approaching deadlines, matched to the filters you picked.
      </p>
      <a href="${confirmUrl}" style="display:inline-block;background:${COLORS.accent};color:${COLORS.accentInk};font-size:15px;font-weight:700;text-decoration:none;padding:13px 26px;border-radius:12px;">
        Confirm subscription
      </a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:${COLORS.ink4};">
        If you didn't sign up for this, just ignore this email — nothing happens without the click.
      </p>
    </td></tr>`;
  const footer = `CatchIt · the deadline radar`;
  return { subject: "Confirm your CatchIt digest subscription", html: shell(body, footer) };
}

interface DigestSections {
  closingSoon: PublicOpportunity[];
  newThisWeek: PublicOpportunity[];
}

function itemRow(o: PublicOpportunity, siteUrl: string): string {
  const category = CATEGORY_LABELS[o.category];
  const deadline = formatDeadlineFull(o.deadline);
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:14px;margin-bottom:10px;">
      <tr><td style="padding:16px 18px;">
        <div style="font-size:11px;font-weight:600;color:${COLORS.accent};margin-bottom:6px;">${escapeHtml(category)} · ${escapeHtml(deadline)}</div>
        <a href="${siteUrl}/opportunity/${o.id}" style="font-size:16px;font-weight:600;color:${COLORS.ink};text-decoration:none;line-height:1.3;">${escapeHtml(o.title)}</a>
        <div style="font-size:13px;color:${COLORS.ink3};margin-top:4px;">${escapeHtml(o.organization)}</div>
        <div style="font-size:13.5px;color:${COLORS.ink2};line-height:1.5;margin-top:8px;">${escapeHtml(o.snippet)}</div>
      </td></tr>
    </table>`;
}

function sectionBlock(heading: string, items: PublicOpportunity[], siteUrl: string): string {
  if (items.length === 0) return "";
  return `
    <tr><td style="padding:8px 0 4px;">
      <h2 style="margin:0 0 12px;font-size:13px;font-weight:600;color:${COLORS.ink3};text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(heading)}</h2>
      ${items.map((o) => itemRow(o, siteUrl)).join("")}
    </td></tr>`;
}

export function digestEmail(
  sections: DigestSections,
  unsubscribeUrl: string,
  siteUrl: string
): { subject: string; html: string } {
  const closingCount = sections.closingSoon.length;
  const subject =
    closingCount > 0
      ? `${closingCount} deadline${closingCount === 1 ? "" : "s"} closing soon on your radar`
      : "New on your CatchIt radar this week";

  const body = `
    <tr><td>
      <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:${COLORS.ink};letter-spacing:-0.02em;">Your week on the radar</h1>
    </td></tr>
    ${sectionBlock("Closing within a week — act now", sections.closingSoon, siteUrl)}
    ${sectionBlock("New this week", sections.newThisWeek, siteUrl)}
    <!-- sponsor slot: reserved from day one so adding a (clearly labelled)
         sponsor later is a content change, not a template change -->
    <tr><td style="padding-top:4px;"></td></tr>`;

  const footer = `
    You're getting this because you subscribed to the CatchIt weekly digest.<br>
    <a href="${unsubscribeUrl}" style="color:${COLORS.ink3};">Unsubscribe instantly</a> ·
    <a href="${siteUrl}" style="color:${COLORS.ink3};">Browse everything</a>`;

  return { subject, html: shell(body, footer) };
}

export function deadlineReminderEmail(
  opportunity: PublicOpportunity,
  urgency: "7d" | "48h",
  siteUrl: string
): { subject: string; html: string } {
  const headline = urgency === "48h" ? "Closes in 48 hours" : "Closes in a week";
  const subject = `${headline}: ${opportunity.title}`;

  const body = `
    <tr><td style="padding-bottom:8px;">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${COLORS.ink};letter-spacing:-0.02em;">${escapeHtml(headline)} — you saved this one</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${COLORS.ink2};">
        One of your saved opportunities is closing soon. Here it is again so it doesn't slip past you.
      </p>
    </td></tr>
    <tr><td>${itemRow(opportunity, siteUrl)}</td></tr>
    <tr><td style="padding-top:6px;">
      <a href="${siteUrl}/opportunity/${opportunity.id}" style="display:inline-block;background:${COLORS.accent};color:${COLORS.accentInk};font-size:15px;font-weight:700;text-decoration:none;padding:13px 26px;border-radius:12px;">
        View details
      </a>
    </td></tr>`;

  const footer = `
    You're getting this because you saved this opportunity in your CatchIt account.<br>
    <a href="${siteUrl}/account" style="color:${COLORS.ink3};">Manage saved items</a> ·
    <a href="${siteUrl}" style="color:${COLORS.ink3};">Browse everything</a>`;

  return { subject, html: shell(body, footer) };
}

export function newMatchesEmail(
  items: PublicOpportunity[],
  siteUrl: string
): { subject: string; html: string } {
  const count = items.length;
  const subject = `${count} new opportunit${count === 1 ? "y matches" : "ies match"} your filters`;

  const body = `
    <tr><td style="padding-bottom:8px;">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${COLORS.ink};letter-spacing:-0.02em;">New on your radar</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${COLORS.ink2};">
        ${count} new opportunit${count === 1 ? "y matches" : "ies match"} one of your followed filters.
      </p>
    </td></tr>
    <tr><td>${items.map((o) => itemRow(o, siteUrl)).join("")}</td></tr>`;

  const footer = `
    You're getting this because you followed a filter in your CatchIt account.<br>
    <a href="${siteUrl}/account" style="color:${COLORS.ink3};">Manage followed filters</a> ·
    <a href="${siteUrl}" style="color:${COLORS.ink3};">Browse everything</a>`;

  return { subject, html: shell(body, footer) };
}
