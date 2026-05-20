const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

async function getAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

export async function createCalendarEvent(params: {
  refreshToken: string;
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}): Promise<string | null> {
  const accessToken = await getAccessToken(params.refreshToken);
  if (!accessToken) return null;

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: { dateTime: params.startTime.toISOString() },
      end: { dateTime: params.endTime.toISOString() },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id ?? null;
}

export async function deleteCalendarEvent(eventId: string, refreshToken: string): Promise<void> {
  const accessToken = await getAccessToken(refreshToken);
  if (!accessToken) return;
  await fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
