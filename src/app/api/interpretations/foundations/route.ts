import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { translatedExternalLibraryEntries } from "@/lib/interpretations/libraryStore";

const querySchema = z.enum(["NUMEROLOGY", "MATRIX_DESTINY", "PSYCHOLOGICAL_PROFILE"]);

/**
 * Public, curated source notes used by the three reflection sections. Only
 * active library entries are returned; private uploads are never queried.
 */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(request.nextUrl.searchParams.get("type"));
  if (!parsed.success) {
    return NextResponse.json({ error: "უცნობი ბიბლიოთეკის კატეგორიაა." }, { status: 400 });
  }

  const entries = await translatedExternalLibraryEntries({ chartType: parsed.data });
  return NextResponse.json(
    { entries, source: "curated-interpretation-library" },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } },
  );
}
