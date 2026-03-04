import { config } from "@/lib/config";
import { AccessToken } from "livekit-server-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (
    !config.livekit.apiKey ||
    !config.livekit.apiSecret ||
    !config.livekit.url
  ) {
    return Response.json(
      { error: true, message: "Voice call is not configured." },
      { status: 503 }
    );
  }

  const roomName = `voice-${Date.now()}`;
  const participantIdentity = `visitor-${Date.now()}`;

  const token = new AccessToken(
    config.livekit.apiKey,
    config.livekit.apiSecret,
    {
      identity: participantIdentity,
      ttl: "5m",
    }
  );

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: false,
  });

  const jwt = await token.toJwt();

  return Response.json({
    token: jwt,
    url: config.livekit.url,
    roomName,
  });
}
