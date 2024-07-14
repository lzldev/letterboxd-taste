import { type NextRequest, NextResponse } from "next/server";
import { scrapeUserDiary } from "~/lib/letterboxd/scrape/user/diary";
import { scrapeUserProfile } from "~/lib/letterboxd/scrape/user/profile";

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

  const [profile, diary] = await Promise.all([
    scrapeUserProfile(username),
    // scrapeUserDiary(username),
  ]);

  return NextResponse.json({ profile, time: new Date().getTime() });
}
