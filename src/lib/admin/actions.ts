"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStaff } from "./auth";

// Every mutating action re-verifies staff server-side — never trust that only
// the admin UI can reach these.
async function assertStaff() {
  const staff = await getStaff();
  if (!staff) throw new Error("Not authorized");
  return staff;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export type TierInput = { min_qty: number; unit_price_usd: number };
export type ProductInput = {
  id?: string;
  supplier_id: string | null;
  slug?: string;
  name: string;
  section?: string; // 'farm' (default) | 'raw'
  category: string;
  origin_country: string;
  origin_flag: string | null;
  blurb: string | null;
  description: string | null;
  base_unit: string;
  retail_price_usd: number;
  in_stock: boolean;
  image_urls: string[];
  origin_region: string | null;
  harvest_date: string | null;
  moisture_pct: number | null;
  grade: string | null;
  certifications: string[];
  quality_report_url: string | null;
  batch_photo_urls: string[];
  synonyms: string[];
  tiers: TierInput[];
};

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  try {
    await assertStaff();
    const db = createSupabaseAdminClient();

    const { tiers, id, ...rest } = input;
    const slug = input.slug?.trim() || `${slugify(input.name)}-${Date.now().toString(36).slice(-4)}`;

    const row = { ...rest, slug };

    let productId = id;
    if (id) {
      const { error } = await db.from("products").update(row).eq("id", id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { data, error } = await db
        .from("products")
        .insert(row)
        .select("id")
        .single();
      if (error) return { ok: false, error: error.message };
      productId = data.id;
    }

    // Replace tiers (simple + idempotent).
    await db.from("product_price_tiers").delete().eq("product_id", productId!);
    const validTiers = tiers.filter((t) => t.min_qty > 0 && t.unit_price_usd > 0);
    if (validTiers.length) {
      const { error } = await db
        .from("product_price_tiers")
        .insert(validTiers.map((t) => ({ ...t, product_id: productId! })));
      if (error) return { ok: false, error: error.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/raw-materials");
    return { ok: true, id: productId! };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to save product" };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await assertStaff();
    const db = createSupabaseAdminClient();
    const { error } = await db.from("products").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/raw-materials");
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to delete" };
  }
}

// Order lifecycle: every order flows through us to the merchant.
//   placed → confirmed → processing (with supplier) → shipped → delivered
// refunded is a terminal off-track state.
const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "refunded",
];

export async function updateOrderStatus(
  id: string,
  status: string,
  trackingNote?: string | null
): Promise<ActionResult> {
  try {
    await assertStaff();
    if (!ORDER_STATUSES.includes(status)) {
      return { ok: false, error: "Invalid status" };
    }
    const db = createSupabaseAdminClient();
    const patch: Record<string, unknown> = {
      status,
      status_updated_at: new Date().toISOString(),
    };
    if (trackingNote !== undefined) patch.tracking_note = trackingNote || null;
    const { error } = await db.from("orders").update(patch).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/orders");
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to update order" };
  }
}

// ---- Merchant applications -------------------------------------------------

export type ApplicationInput = {
  business_name: string;
  country: string;
  contact_email: string | null;
  contact_phone: string | null;
  categories: string[];
  message: string | null;
};

// PUBLIC — submitted from /become-a-supplier. No staff check; writes via the
// service role so the table stays locked to anon otherwise.
export async function submitApplication(
  input: ApplicationInput
): Promise<ActionResult> {
  try {
    if (!input.business_name?.trim() || !input.country?.trim()) {
      return { ok: false, error: "Business name and country are required." };
    }
    if (!input.contact_email && !input.contact_phone) {
      return { ok: false, error: "Provide an email or phone so we can reach you." };
    }
    const db = createSupabaseAdminClient();
    const { data, error } = await db
      .from("supplier_applications")
      .insert({ ...input, status: "pending" })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/merchants");
    return { ok: true, id: data.id };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to submit application" };
  }
}

export async function approveApplication(id: string): Promise<ActionResult> {
  try {
    await assertStaff();
    const db = createSupabaseAdminClient();
    const { data: app, error: appErr } = await db
      .from("supplier_applications")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (appErr || !app) return { ok: false, error: "Application not found" };
    if (app.status === "approved") return { ok: true, id };

    // Create the verified supplier behind the brand. `contact` becomes their
    // merchant-portal login identity (prefer email, fall back to phone).
    const contact = app.contact_email || app.contact_phone || null;
    const { data: supplier, error: supErr } = await db
      .from("suppliers")
      .insert({
        business_name: app.business_name,
        country: app.country,
        verified: true,
        contact: contact ? String(contact).toLowerCase() : null,
      })
      .select("id")
      .single();
    if (supErr) return { ok: false, error: supErr.message };

    const { error: updErr } = await db
      .from("supplier_applications")
      .update({
        status: "approved",
        supplier_id: supplier.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updErr) return { ok: false, error: updErr.message };

    revalidatePath("/admin/merchants");
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to approve" };
  }
}

export async function rejectApplication(id: string): Promise<ActionResult> {
  try {
    await assertStaff();
    const db = createSupabaseAdminClient();
    const { error } = await db
      .from("supplier_applications")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/merchants");
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to reject" };
  }
}

// ---- Quote requests --------------------------------------------------------

const QUOTE_STATUSES = ["new", "reviewing", "quoted", "closed"];

export async function updateQuoteStatus(
  id: string,
  status: string
): Promise<ActionResult> {
  try {
    await assertStaff();
    if (!QUOTE_STATUSES.includes(status)) {
      return { ok: false, error: "Invalid status" };
    }
    const db = createSupabaseAdminClient();
    const { error } = await db
      .from("quote_requests")
      .update({ status })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${id}`);
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to update quote" };
  }
}

// ---- Merchant product approval ---------------------------------------------

export async function approveProduct(id: string): Promise<ActionResult> {
  try {
    await assertStaff();
    const db = createSupabaseAdminClient();
    const { error } = await db
      .from("products")
      .update({ approval_status: "approved", rejection_reason: null })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/raw-materials");
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to approve product" };
  }
}

export async function rejectProduct(
  id: string,
  reason: string
): Promise<ActionResult> {
  try {
    await assertStaff();
    const db = createSupabaseAdminClient();
    const { error } = await db
      .from("products")
      .update({ approval_status: "rejected", rejection_reason: reason || null })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/raw-materials");
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to reject product" };
  }
}

// ---- News & events posts ---------------------------------------------------

export type PostInput = {
  id?: string;
  title: string;
  body: string | null;
  image_urls: string[];
  kind: string; // 'news' | 'event'
  event_date: string | null;
  published: boolean;
};

export async function savePost(input: PostInput): Promise<ActionResult> {
  try {
    await assertStaff();
    if (!input.title?.trim()) return { ok: false, error: "Title is required." };
    const db = createSupabaseAdminClient();
    const { id, ...rest } = input;
    const row = {
      ...rest,
      title: input.title.trim(),
      event_date: input.event_date || null,
    };
    let postId = id;
    if (id) {
      const { error } = await db.from("posts").update(row).eq("id", id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { data, error } = await db.from("posts").insert(row).select("id").single();
      if (error) return { ok: false, error: error.message };
      postId = data.id;
    }
    revalidatePath("/admin/posts");
    revalidatePath("/about");
    return { ok: true, id: postId! };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to save post" };
  }
}

export async function deletePost(id: string): Promise<ActionResult> {
  try {
    await assertStaff();
    const db = createSupabaseAdminClient();
    const { error } = await db.from("posts").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/posts");
    revalidatePath("/about");
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to delete post" };
  }
}

// ---- Chatbot knowledge base ------------------------------------------------

export async function updateChatbotKnowledge(
  content: string
): Promise<ActionResult> {
  try {
    await assertStaff();
    const db = createSupabaseAdminClient();
    const { error } = await db.from("chatbot_knowledge").upsert(
      { id: true, content: content ?? "", updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/knowledge");
    return { ok: true, id: "knowledge" };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to save knowledge" };
  }
}

// ---- Billboard banners -----------------------------------------------------

export type BannerInput = {
  id?: string;
  media_url: string;
  media_type: "image" | "video";
  headline: string | null;
  subtitle: string | null;
  link_url: string | null;
  cta_label: string | null;
  sort: number;
  active: boolean;
};

export async function saveBanner(input: BannerInput): Promise<ActionResult> {
  try {
    await assertStaff();
    if (!input.media_url) return { ok: false, error: "Upload a banner image or video first." };
    const db = createSupabaseAdminClient();
    const { id, ...row } = input;
    let bannerId = id;
    if (id) {
      const { error } = await db.from("banners").update(row).eq("id", id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { data, error } = await db.from("banners").insert(row).select("id").single();
      if (error) return { ok: false, error: error.message };
      bannerId = data.id;
    }
    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { ok: true, id: bannerId! };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to save banner" };
  }
}

export async function toggleBanner(id: string, active: boolean): Promise<ActionResult> {
  try {
    await assertStaff();
    const db = createSupabaseAdminClient();
    const { error } = await db.from("banners").update({ active }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to update banner" };
  }
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  try {
    await assertStaff();
    const db = createSupabaseAdminClient();
    const { error } = await db.from("banners").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to delete banner" };
  }
}

// ---- Testimonials ----------------------------------------------------------

export type TestimonialInput = {
  customer_name: string;
  location: string | null;
  rating: number;
  comment: string;
};

// PUBLIC — submitted from /leave-a-review. No staff check; writes via the
// service role so the table stays locked to anon. Lands as 'pending' for
// moderation before it can appear in the slideshow.
export async function submitTestimonial(
  input: TestimonialInput
): Promise<ActionResult> {
  try {
    if (!input.customer_name?.trim()) {
      return { ok: false, error: "Please enter your name." };
    }
    if (!input.comment?.trim()) {
      return { ok: false, error: "Please write a short review." };
    }
    const rating = Math.round(Number(input.rating));
    if (!(rating >= 1 && rating <= 5)) {
      return { ok: false, error: "Please give a rating from 1 to 5 stars." };
    }
    const db = createSupabaseAdminClient();
    const { data, error } = await db
      .from("testimonials")
      .insert({
        customer_name: input.customer_name.trim(),
        location: input.location?.trim() || null,
        rating,
        comment: input.comment.trim(),
        approval_status: "pending",
        source: "customer",
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/testimonials");
    return { ok: true, id: data.id };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to submit review" };
  }
}

export type AdminTestimonialInput = TestimonialInput & {
  id?: string;
  approval_status?: string; // pending | approved | rejected
  sort?: number;
  avatar_url?: string | null;
};

// STAFF — add or edit a testimonial. Admin-added ones default to approved.
export async function saveTestimonial(
  input: AdminTestimonialInput
): Promise<ActionResult> {
  try {
    await assertStaff();
    if (!input.customer_name?.trim() || !input.comment?.trim()) {
      return { ok: false, error: "Name and review text are required." };
    }
    const rating = Math.round(Number(input.rating));
    if (!(rating >= 1 && rating <= 5)) {
      return { ok: false, error: "Rating must be 1–5." };
    }
    const db = createSupabaseAdminClient();
    const row = {
      customer_name: input.customer_name.trim(),
      location: input.location?.trim() || null,
      rating,
      comment: input.comment.trim(),
      avatar_url: input.avatar_url?.trim() || null,
      approval_status: input.approval_status ?? "approved",
      sort: input.sort ?? 0,
    };
    let id = input.id;
    if (id) {
      const { error } = await db.from("testimonials").update(row).eq("id", id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { data, error } = await db
        .from("testimonials")
        .insert({ ...row, source: "admin" })
        .select("id")
        .single();
      if (error) return { ok: false, error: error.message };
      id = data.id;
    }
    revalidatePath("/admin/testimonials");
    revalidatePath("/");
    return { ok: true, id: id! };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to save testimonial" };
  }
}

const TESTIMONIAL_STATUSES = ["pending", "approved", "rejected"];

export async function setTestimonialStatus(
  id: string,
  status: string
): Promise<ActionResult> {
  try {
    await assertStaff();
    if (!TESTIMONIAL_STATUSES.includes(status)) {
      return { ok: false, error: "Invalid status" };
    }
    const db = createSupabaseAdminClient();
    const { error } = await db
      .from("testimonials")
      .update({ approval_status: status })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/testimonials");
    revalidatePath("/");
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to update testimonial" };
  }
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  try {
    await assertStaff();
    const db = createSupabaseAdminClient();
    const { error } = await db.from("testimonials").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/testimonials");
    revalidatePath("/");
    return { ok: true, id };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to delete testimonial" };
  }
}

// ---- Inquiries (v2 /request + /inquiry/<slug> forms) ------------------------

const INQUIRY_STATUSES = ["new", "scoped", "quoted", "active", "delivered", "closed"];

export async function updateInquiryStatus(ref: string, status: string): Promise<ActionResult> {
  try {
    await assertStaff();
    if (!INQUIRY_STATUSES.includes(status)) {
      return { ok: false, error: "Invalid status" };
    }
    const db = createSupabaseAdminClient();
    const { error } = await db.from("inquiries").update({ status }).eq("ref", ref);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/inquiries");
    revalidatePath(`/admin/inquiries/${ref}`);
    return { ok: true, id: ref };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to update inquiry" };
  }
}
