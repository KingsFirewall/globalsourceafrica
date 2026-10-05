import Link from "next/link";
import { Package, ShoppingBag, Store, Clock, FileText, Inbox } from "lucide-react";
import { getDashboardCounts, getNewQuoteCount } from "@/lib/admin/data";
import { getNewInquiryCount } from "@/lib/admin/inquiries";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [c, newQuotes, newInquiries] = await Promise.all([
    getDashboardCounts(),
    getNewQuoteCount(),
    getNewInquiryCount(),
  ]);
  const statuses = ["placed", "confirmed", "shipped", "delivered", "refunded"];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-sub">Overview of the marketplace.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat
          label="New inquiries"
          value={newInquiries}
          icon={<Inbox className="h-5 w-5" />}
          href="/admin/inquiries?status=new"
          highlight={newInquiries > 0}
        />
        <Stat label="Products" value={c.products} icon={<Package className="h-5 w-5" />} href="/admin/products" />
        <Stat label="Orders" value={c.orders} icon={<ShoppingBag className="h-5 w-5" />} href="/admin/orders" />
        <Stat
          label="New quote requests"
          value={newQuotes}
          icon={<FileText className="h-5 w-5" />}
          href="/admin/quotes"
          highlight={newQuotes > 0}
        />
        <Stat
          label="Products to review"
          value={c.pendingProducts}
          icon={<Clock className="h-5 w-5" />}
          href="/admin/products"
          highlight={c.pendingProducts > 0}
        />
        <Stat
          label="Pending merchants"
          value={c.pendingApplications}
          icon={<Store className="h-5 w-5" />}
          href="/admin/merchants"
          highlight={c.pendingApplications > 0}
        />
        <Stat
          label="Out of stock"
          value={c.outOfStock}
          icon={<Clock className="h-5 w-5" />}
          href="/admin/products"
          highlight={c.outOfStock > 0}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-greenLine bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Orders by status</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {statuses.map((s) => (
            <div key={s} className="rounded-xl border border-greenLine px-4 py-3">
              <div className="text-2xl font-semibold text-ink">
                {c.ordersByStatus[s] ?? 0}
              </div>
              <div className="text-xs capitalize text-sub">{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/admin/products/new"
          className="rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-white hover:bg-orangeDark"
        >
          Add product
        </Link>
        <Link
          href="/admin/merchants"
          className="rounded-full border border-greenLine bg-white px-5 py-2.5 text-sm font-medium text-ink hover:border-green"
        >
          Review merchants
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  href,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        highlight
          ? "rounded-2xl border border-orange/40 bg-orange/5 p-5 hover:border-orange"
          : "rounded-2xl border border-greenLine bg-white p-5 hover:border-green"
      }
    >
      <div className="flex items-center gap-2 text-sub">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-2 text-3xl font-semibold text-ink">{value}</div>
    </Link>
  );
}
