import { NextRequest, NextResponse } from "next/server";
import { generateSiteFromInput } from "@/lib/ai/pipeline";
import { createSite, isSubdomainAvailable } from "@/lib/firebase/sites";
import { slugify } from "@/lib/utils";

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

    // Ensure subdomain is unique
    let subdomain = slugify(businessName);
    let available = await isSubdomainAvailable(subdomain);
    if (!available) {
      subdomain = `${subdomain}-${Date.now().toString(36)}`;
    }
    site.subdomain = subdomain;

    await createSite(site);

    return NextResponse.json({ siteId: site.siteId, subdomain: site.subdomain });
  } catch (err) {
    console.error("Generate site error:", err);
    return NextResponse.json({ error: "Failed to generate site" }, { status: 500 });
  }
}
