export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("user_email");
  if (!userEmail) {
    return new Response("Missing user_email", { status: 400 });
  }

  const backendUrl = `http://localhost:8000/api/notifications/stream?user_email=${encodeURIComponent(userEmail)}`;

  try {
    const backend = await fetch(backendUrl);
    if (!backend.ok) {
      return new Response("Backend error", { status: 502 });
    }
    return new Response(backend.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response("Backend unreachable", { status: 502 });
  }
}
