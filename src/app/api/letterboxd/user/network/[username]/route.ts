import { type NextRequest, NextResponse } from "next/server";
import { ScrapeUser } from "~/lib/services/user";
import { WalkUserNetwork } from "~/lib/services/network";

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

  const user = await ScrapeUser(username);

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
  const network = await WalkUserNetwork(user, { userSet: new Set() });
  console.timeEnd(timerStr);

  return NextResponse.json({
    network,
  });
}
