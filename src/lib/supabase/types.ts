// Hand-written to match supabase/migrations/20260702091236_init.sql.
// Once a Supabase project is linked, regenerate with:
//   npx supabase gen types typescript --linked > src/lib/supabase/types.ts
// and fold any drift back into the categories/helpers below.

export type OpportunityCategory =
  | "hackathon"
  | "voucher"
  | "event"
  | "scholarship"
  | "internship"
  | "conference"
  | "journal"
  | "other";

export type OpportunityStatus = "pending" | "approved" | "rejected";

export type OpportunityLinkStatus = "ok" | "broken" | "unchecked";

export type AudienceTag = "students" | "researchers" | "professionals";

// `type` rather than `interface`: postgrest-js's GenericTable/GenericView
// constraints check against `Record<string, unknown>`, which plain
// interfaces don't structurally satisfy (a well-known TS quirk) — that
// silently collapses every `.from(...).select(...)` result to `never`.
export type Opportunity = {
  id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  snippet: string;
  description: string;
  eligibility: string[];
  url: string;
  normalized_url: string;
  deadline: string | null;
  deadline_note: string | null;
  region_tags: string[];
  audience_tags: string[];
  source: string;
  status: OpportunityStatus;
  link_status: OpportunityLinkStatus;
  last_checked_at: string | null;
  discovered_at: string;
  reviewed_at: string | null;
  submitter_email: string | null;
  normalized_title: string;
};

/** Columns exposed by the `opportunities_public` view (no submitter_email, no dedup/status internals). */
export type PublicOpportunity = Pick<
  Opportunity,
  | "id"
  | "title"
  | "organization"
  | "category"
  | "snippet"
  | "description"
  | "eligibility"
  | "url"
  | "deadline"
  | "deadline_note"
  | "region_tags"
  | "audience_tags"
  | "source"
  | "discovered_at"
>;

export type DiscoveryRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "completed" | "failed";
  source_counts: Record<
    string,
    { found: number; inserted: number; skipped: number; failed: number }
  >;
  found_count: number;
  inserted_count: number;
  skipped_count: number;
  failed_count: number;
  error_notes: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      opportunities: {
        Row: Opportunity;
        Insert: Partial<Opportunity> &
          Pick<
            Opportunity,
            "title" | "organization" | "category" | "snippet" | "description" | "url" | "source"
          >;
        Update: Partial<Opportunity>;
        Relationships: [];
      };
      discovery_runs: {
        Row: DiscoveryRun;
        Insert: Partial<DiscoveryRun>;
        Update: Partial<DiscoveryRun>;
        Relationships: [];
      };
      admin_users: {
        Row: AdminUser;
        Insert: Partial<AdminUser> & Pick<AdminUser, "id" | "email" | "display_name">;
        Update: Partial<AdminUser>;
        Relationships: [];
      };
    };
    Views: {
      opportunities_public: {
        Row: PublicOpportunity;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
}

// `as const satisfies` keeps this a readonly literal tuple (so zod's
// z.enum(CATEGORIES) works directly) while still checking it covers every
// OpportunityCategory value.
export const CATEGORIES = [
  "hackathon",
  "voucher",
  "event",
  "scholarship",
  "internship",
  "conference",
  "journal",
  "other",
] as const satisfies readonly OpportunityCategory[];

export const CATEGORY_LABELS: Record<OpportunityCategory, string> = {
  hackathon: "Hackathon",
  voucher: "Voucher & Credit",
  event: "Event",
  scholarship: "Scholarship",
  internship: "Internship",
  conference: "Conference CFP",
  journal: "Journal CFP",
  other: "Other",
};

export const AUDIENCE_TAGS = [
  "students",
  "researchers",
  "professionals",
] as const satisfies readonly AudienceTag[];

export const AUDIENCE_LABELS: Record<AudienceTag, string> = {
  students: "Students",
  researchers: "Researchers",
  professionals: "Professionals",
};
