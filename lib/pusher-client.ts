import PusherJS from "pusher-js";

let pusherClient: PusherJS | null = null;

export function getPusherClient(): PusherJS {
  if (pusherClient && pusherClient.connection.state !== "disconnected") {
    return pusherClient;
  }

  pusherClient = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: "/api/pusher/auth",
  });

  return pusherClient;
}
