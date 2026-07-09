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
  status: "running" | "awaiting_batch" | "completed" | "failed";
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

export type DiscoveryBatch = {
  id: string;
  run_id: string;
  batch_id: string;
  task_map: Record<string, { category: string; query: string }>;
  status: "submitted" | "collected" | "failed";
  created_at: string;
  collected_at: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
};

export type Subscriber = {
  id: string;
  email: string;
  categories: string[];
  regions: string[];
  audiences: string[];
  confirm_token: string;
  unsubscribe_token: string;
  confirmed_at: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  calendar_token: string;
  created_at: string;
  preferred_audience: string[];
  preferred_regions: string[];
};

export const APPLICATION_STATUSES = ["saved", "applied", "got_it", "no_luck"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  got_it: "Got it! 🎉",
  no_luck: "No luck",
};

export type SavedOpportunity = {
  id: string;
  user_id: string;
  opportunity_id: string;
  created_at: string;
  reminder_7d_sent_at: string | null;
  reminder_48h_sent_at: string | null;
  status: ApplicationStatus;
  status_updated_at: string;
  note: string;
};

export type FollowedFilter = {
  id: string;
  user_id: string;
  categories: string[];
  regions: string[];
  audiences: string[];
  created_at: string;
  last_alerted_at: string;
};

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

export type StoryStatus = "pending" | "approved" | "rejected";

export type Story = {
  id: string;
  name: string;
  role_line: string;
  story: string;
  opportunity_url: string | null;
  status: StoryStatus;
  submitted_at: string;
  reviewed_at: string | null;
};

/** Columns exposed by the `stories_public` view (approved rows only, no status/review internals). */
export type PublicStory = Pick<
  Story,
  "id" | "name" | "role_line" | "story" | "opportunity_url" | "submitted_at"
>;

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
      subscribers: {
        Row: Subscriber;
        Insert: Partial<Subscriber> & Pick<Subscriber, "email">;
        Update: Partial<Subscriber>;
        Relationships: [];
      };
      discovery_batches: {
        Row: DiscoveryBatch;
        Insert: Partial<DiscoveryBatch> & Pick<DiscoveryBatch, "run_id" | "batch_id" | "task_map">;
        Update: Partial<DiscoveryBatch>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      saved_opportunities: {
        Row: SavedOpportunity;
        Insert: Partial<SavedOpportunity> & Pick<SavedOpportunity, "user_id" | "opportunity_id">;
        Update: Partial<SavedOpportunity>;
        Relationships: [];
      };
      followed_filters: {
        Row: FollowedFilter;
        Insert: Partial<FollowedFilter> & Pick<FollowedFilter, "user_id">;
        Update: Partial<FollowedFilter>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: PushSubscriptionRow;
        Insert: Partial<PushSubscriptionRow> &
          Pick<PushSubscriptionRow, "user_id" | "endpoint" | "p256dh" | "auth">;
        Update: Partial<PushSubscriptionRow>;
        Relationships: [];
      };
      stories: {
        Row: Story;
        Insert: Partial<Story> & Pick<Story, "name" | "story">;
        Update: Partial<Story>;
        Relationships: [];
      };
    };
    Views: {
      opportunities_public: {
        Row: PublicOpportunity;
        Relationships: [];
      };
      stories_public: {
        Row: PublicStory;
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

export const REGIONS = ["UK", "Remote", "Global"] as const;
