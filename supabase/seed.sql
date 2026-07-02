-- Sample approved opportunities for local testing. Applied automatically by
-- `supabase db reset`, or run manually against a linked project. Deadlines
-- are relative to `now()` so the feed always looks alive regardless of
-- when this is run.

insert into opportunities
  (title, organization, category, snippet, description, eligibility, url, deadline, deadline_note, region_tags, audience_tags, source, status, reviewed_at)
values
  (
    'Hack the Valley 2026', 'University of Toronto', 'hackathon',
    '36-hour student hackathon with $40k in prizes, free travel reimbursement for select teams, and mentors from Shopify and Google.',
    'Hack the Valley is one of Canada''s largest student-run hackathons. Over 36 hours you''ll build a project from scratch alongside 700+ hackers, with hardware labs, workshops, and mentorship on tap throughout. Beginners are genuinely welcome — roughly a third of attendees are at their first hackathon.',
    array['Currently enrolled undergraduate or postgraduate students', 'Any discipline — you do not need to be a CS major', 'Teams of up to 4; solo hackers can find a team on-site'],
    'https://hackthevalley.io', now() + interval '3 days', null,
    array['Global'], array['students'], 'seed', 'approved', now()
  ),
  (
    'GitHub Student Developer Pack', 'GitHub Education', 'voucher',
    'The big one: free access to 100+ developer tools while you''re a student — domains, cloud hosting, IDEs and more, no deadline.',
    'The Student Developer Pack bundles free or discounted access to a huge range of industry tools — a free .me domain, cloud credits, JetBrains IDEs, Notion, and dozens more. Verify once with your student status and it stays active for the duration of your studies.',
    array['Aged 13 or older', 'Currently enrolled in a degree- or diploma-granting course', 'Have a verifiable school-issued email address or documents'],
    'https://education.github.com/pack', null, null,
    array['Global'], array['students'], 'seed', 'approved', now()
  ),
  (
    'PyCon UK 2026 — Call for Proposals', 'PyCon UK Society', 'conference',
    'First-time speakers strongly encouraged. Talks, posters and lightning slots — no prior speaking experience required.',
    'PyCon UK is the friendliest Python conference around, and the CFP is deliberately open to newcomers. Submit a 25-minute talk, a poster, or a 5-minute lightning slot. Accepted student speakers get a free ticket and mentoring to help shape the talk.',
    array['Open to anyone in the Python community', 'Dedicated mentoring track for first-time speakers', 'Financial assistance available for travel & accommodation'],
    'https://pretalx.com/pyconuk-2026', now() + interval '42 days', 'Abstract deadline — full talk details are due after acceptance',
    array['UK'], array['students', 'researchers', 'professionals'], 'seed', 'approved', now()
  ),
  (
    'AWS Cloud Credits for Students — up to $300', 'Amazon Web Services', 'voucher',
    'Free tier plus promotional credits for coursework and side projects. Spin up real infrastructure without the bill.',
    'AWS Educate gives students hands-on access to AWS services with promotional credits on top of the always-free tier. Ideal for coursework, dissertations, or that side project you keep meaning to deploy.',
    array['16 years or older', 'Enrolled at an accredited institution', 'Personal or institution-issued email accepted'],
    'https://aws.amazon.com/education/awseducate', null, null,
    array['Global'], array['students'], 'seed', 'approved', now()
  ),
  (
    'DeepMind Scholarship for Underrepresented Groups in AI & ML Research', 'Google DeepMind', 'scholarship',
    'Full tuition plus a living stipend and a dedicated mentor for postgraduate study in AI/ML at partner universities.',
    'This scholarship covers full tuition and a generous living stipend for students from groups underrepresented in the field, pursuing a Master''s in AI or ML at a partner institution. Each scholar is paired with a DeepMind researcher as a mentor throughout the programme.',
    array['From a group underrepresented in AI/ML', 'Holding or expecting a strong undergraduate degree', 'Admitted to (or applying for) a partner Master''s programme'],
    'https://deepmind.google/scholarships', now() + interval '85 days', null,
    array['Global'], array['students', 'researchers'], 'seed', 'approved', now()
  ),
  (
    'Summer 2026 Software Engineering Internship', 'Monzo', 'internship',
    '12-week paid internship in London or remote. Ship real code to millions of customers with a dedicated buddy and mentor.',
    'Spend 12 weeks embedded in a real engineering squad, shipping features used by millions. You''ll get a buddy, a mentor, and the same tools and autonomy as a full-time engineer. Interns are paid competitively and many receive return offers.',
    array['Penultimate- or final-year students', 'Some programming experience in any language', 'Right to work in the UK for the internship period'],
    'https://monzo.com/careers', now() + interval '60 hours', null,
    array['UK'], array['students'], 'seed', 'approved', now()
  ),
  (
    'Notion for Students & Educators — Free Plus Plan', 'Notion', 'voucher',
    'The full Plus plan, free, for anyone with a school email. Notes, databases and AI for your whole degree.',
    'Notion gives students and educators its Plus plan at no cost. Unlimited blocks, file uploads, and access to Notion AI — enough to run your entire academic life from one workspace.',
    array['Have a valid school-issued email address', 'Students and educators both qualify'],
    'https://notion.so/students', null, null,
    array['Global'], array['students'], 'seed', 'approved', now()
  ),
  (
    'EMNLP 2026 Student Volunteer Applications', 'ACL / EMNLP', 'conference',
    'Volunteer a few hours and get free conference registration to one of NLP''s top venues. Remote-friendly roles available.',
    'Student volunteers help the conference run smoothly and, in return, receive complimentary registration. Roles range from session support to remote moderation, so there''s something whether or not you can attend in person.',
    array['Current students at any level', 'Available for a small number of volunteer shifts', 'Interest in NLP — but no publication required'],
    'https://2026.emnlp.org/volunteers', now() + interval '30 hours', null,
    array['Remote'], array['students', 'researchers'], 'seed', 'approved', now()
  ),
  (
    'JetBrains Free Educational Licenses', 'JetBrains', 'voucher',
    'Free access to the entire JetBrains suite — IntelliJ, PyCharm, WebStorm and the rest — for as long as you study.',
    'A free educational licence unlocks all JetBrains IDEs and tools for students and teachers. Renew each year with your student status and keep the full toolbox at no cost.',
    array['Enrolled students or teaching staff', 'University email or ISIC card for verification'],
    'https://jetbrains.com/student', null, null,
    array['Global'], array['students'], 'seed', 'approved', now()
  ),
  (
    'Bristol Women in Tech Bursary', 'University of Bristol', 'scholarship',
    'A £2,000 bursary supporting women beginning a computing-related degree in the South West.',
    'This bursary supports women entering their first year of a computing-related degree, easing the financial side and connecting recipients with a mentoring network of alumnae working in the regional tech scene.',
    array['Women beginning a computing-related undergraduate degree', 'Studying at an institution in the South West of England', 'Household income assessment may apply'],
    'https://bristol.ac.uk/bursaries', now() + interval '35 days', null,
    array['UK'], array['students'], 'seed', 'approved', now()
  ),
  (
    'Figma Config 2026 — Student Tickets', 'Figma', 'event',
    'Heavily discounted student passes to Figma''s flagship design & product conference. Livestream option included.',
    'Config is Figma''s annual gathering for designers, developers and product folk. Discounted student tickets include access to talks, workshops and the community — with a full livestream tier if you can''t make it in person.',
    array['Current students with valid ID', 'Available in limited quantity — first come, first served'],
    'https://config.figma.com', now() + interval '10 days', null,
    array['Remote'], array['students', 'professionals'], 'seed', 'approved', now()
  ),
  (
    'IEEE Transactions — Special Issue on Trustworthy AI', 'IEEE', 'journal',
    'Call for papers on trustworthy and explainable AI. Rolling review, open to first-time authors and PhD students.',
    'This special issue solicits original research and survey papers on trustworthy, explainable, and robust AI systems. Reviews are conducted on a rolling basis, and the editors explicitly welcome first submissions from PhD students.',
    array['Open to academic and industry researchers', 'PhD students welcome as lead or co-authors', 'Submissions via the journal''s standard portal'],
    'https://ieee.org/publications/special-issues/trustworthy-ai', now() + interval '60 days',
    'Rolling submissions — this date is when the special issue closes to new submissions',
    array['Global'], array['researchers'], 'seed', 'approved', now()
  ),
  (
    'Manchester Civic Tech Weekend', 'Manchester Digital', 'hackathon',
    'A weekend hackathon building tools for local council services, open to students and working professionals alike.',
    'Teams spend a weekend prototyping tools that make local council and civic services easier to use, working directly with council staff as domain experts. No civic-tech experience required — enthusiasm and a laptop are enough.',
    array['Open to students and professionals', 'Teams of 2–5, solo entrants can be matched', 'No prior civic-tech experience needed'],
    'https://manchesterdigital.com/civic-tech-weekend', now() + interval '5 days', null,
    array['UK'], array['students', 'professionals'], 'seed', 'approved', now()
  );
