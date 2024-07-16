import { type NextRequest, NextResponse } from "next/server";
import { UserNetworkFlatMapGraph } from "~/lib/services/user";

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

  const graph = (await UserNetworkFlatMapGraph(username)).at(0)!.graph;

  if (!graph) {
    return NextResponse.json(
      {
        error: "User not found",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    graph,
  });
}
