import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params: { id } }: { params: { id: string } },
) {
  if (!id) {
    return NextResponse.json(
      {
        error: "No id",
      },
      {
        status: 400,
      },
    );
  }
}
