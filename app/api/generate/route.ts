import { NextRequest, NextResponse } from "next/server";
import { generateSiteFromInput } from "@/lib/ai/pipeline";
import { createSite } from "@/lib/firebase/sites";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessName,
      category,
      description,
      address,
      phone,
      reviews,
      menuItems,
      vibes,
      heroImage,
      galleryImages,
      ownerId,
    } = body;

    if (!businessName || !ownerId) {
      return NextResponse.json({ error: "businessName and ownerId required" }, { status: 400 });
    }

    const site = await generateSiteFromInput({
      businessName,
      category,
      description,
      address,
      phone,
      reviews,
      menuItems,
      vibes,
      heroImage,
      galleryImages,
      ownerId,
    });

    // siteId 자체가 고유한 영숫자 식별자이므로 subdomain으로 그대로 사용.
    site.subdomain = site.siteId;

    await createSite(site);

    return NextResponse.json({ siteId: site.siteId, subdomain: site.subdomain });
  } catch (err) {
    console.error("Generate site error:", err);
    return NextResponse.json({ error: "Failed to generate site" }, { status: 500 });
  }
}
