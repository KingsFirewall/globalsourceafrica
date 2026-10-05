"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Package,
  ShoppingBag,
  Store,
  Image as ImageIcon,
  FileText,
  Newspaper,
  MessageSquareQuote,
  Bot,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/quotes", label: "Quotes", icon: FileText },
  { href: "/admin/merchants", label: "Merchants", icon: Store },
  { href: "/admin/banners", label: "Billboard", icon: ImageIcon },
  { href: "/admin/posts", label: "News & events", icon: Newspaper },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/knowledge", label: "Assistant", icon: Bot },
];

export function AdminNav({
  staffName,
  role,
}: {
  staffName: string;
  role: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-full shrink-0 lg:w-60">
      <div className="rounded-2xl border border-greenLine bg-white p-4">
        <Link href="/admin" className="font-display text-lg font-semibold text-green">
          GlobalSource
        </Link>
        <p className="text-xs text-sub">Admin</p>

        <nav className="mt-4 space-y-1">
          {links.map((l) => {
            const active = l.exact
              ? pathname === l.href
              : pathname.startsWith(l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  active
                    ? "flex items-center gap-2 rounded-lg bg-greenSoft px-3 py-2 text-sm font-medium text-green"
                    : "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-greenSoft"
                }
              >
                <Icon className="h-4 w-4" aria-hidden />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-greenLine pt-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sub hover:bg-greenSoft"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            View storefront
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sub hover:bg-greenSoft"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>

        <div className="mt-4 border-t border-greenLine pt-3 text-xs text-sub">
          <p className="truncate font-medium text-ink">{staffName}</p>
          <p className="capitalize">{role}</p>
        </div>
      </div>
    </aside>
  );
}
