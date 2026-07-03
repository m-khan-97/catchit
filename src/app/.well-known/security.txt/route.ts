const CONTACT_EMAIL = "ibrahim.logix@gmail.com";

// RFC 9116. One-year expiry, rolling — bump the date whenever this file
// is next touched for any reason.
const EXPIRES = "2027-07-04T00:00:00.000Z";

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const body = `Contact: mailto:${CONTACT_EMAIL}
Expires: ${EXPIRES}
Canonical: ${siteUrl}/.well-known/security.txt
Preferred-Languages: en
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
