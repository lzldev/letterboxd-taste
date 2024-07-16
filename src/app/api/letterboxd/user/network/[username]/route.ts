import { type NextRequest, NextResponse } from "next/server";
import { getOrScrapeUser, walkUserNetwork } from "~/lib/services/user";

export const dynamic = "force-dynamic"; // defaults to auto

export async function GET(
  _req: NextRequest,
  { params: { username } }: { params: { username: string } },
) {
  if (!username) {
    return NextResponse.json(
      {
        error: "No username",
      },
      {
        status: 400,
      },
    );
  }

  const user = await getOrScrapeUser(username).catch(() => null);

  if (!user) {
    return NextResponse.json(
      {
        error: "User not found",
      },
      {
        status: 404,
      },
    );
  }

  const timerStr = `[WALK_NETWORK] ${username}`;
  console.time(timerStr);
  const network = await walkUserNetwork(user, { userSet: new Set() });
  console.timeEnd(timerStr);

  return NextResponse.json({
    network,
  });
}
