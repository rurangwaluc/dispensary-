import Link from 'next/link';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { Edit, Plus, Search } from 'lucide-react';
import { db } from '@dispensary/db/client';
import { products } from '@dispensary/db/schema';
import { HideItemButton } from '../products/hide-item-button';

type ServicesPageProps = {
  searchParams?: Promise<{
    q?: string;
    take?: string;
  }>;
};

const PAGE_SIZE = 10;

function money(value: string | number) {
  return `RWF ${Number(value).toLocaleString('en-US')}`;
}

function buildLoadMoreHref(q: string, nextTake: number) {
  const params = new URLSearchParams();

  if (q) {
    params.set('q', q);
  }

  params.set('take', String(nextTake));

  return `/services?${params.toString()}`;
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const params = await searchParams;
  const q = params?.q?.trim() || '';
  const take = Math.max(PAGE_SIZE, Number(params?.take || PAGE_SIZE));

  const serviceList = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, 'ACTIVE'),
        eq(products.itemType, 'SERVICE'),
        q
          ? or(
              ilike(products.name, `%${q}%`),
              ilike(products.category, `%${q}%`),
              ilike(products.notes, `%${q}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(products.createdAt));

  const visibleServices = serviceList.slice(0, take);
  const hasMore = serviceList.length > visibleServices.length;

  const totalValue = serviceList.reduce((sum, service) => sum + Number(service.sellingPrice), 0);

  const summary = [
    { label: 'Services', value: serviceList.length, helper: 'Work done for customers' },
    { label: 'Average price', value: serviceList.length ? money(totalValue / serviceList.length) : money(0), helper: 'Normal service price' },
    { label: 'No stock', value: 'Yes', helper: 'Services do not reduce stock' },
    { label: 'Can sell', value: 'Yes', helper: 'Visible in new sale' },
  ];

  return (
    <section className="space-y-4">
      <div className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
              Services
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
              Manage services like injection, consultation, wound dressing, and tests.
            </p>
          </div>

          <Link
            href="/services/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 text-sm font-black text-white shadow-sm transition hover:bg-sky-600"
          >
            <Plus className="h-4 w-4" />
            Add service
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((item) => (
          <article
            key={item.label}
            className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              {item.label}
            </p>
            <p className="mt-3 text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              {item.value}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
              {item.helper}
            </p>
          </article>
        ))}
      </section>

      <div className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search service name or category"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:ring-sky-950"
            />
          </div>
          <button className="h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:bg-slate-800 dark:hover:text-sky-200">
            Search
          </button>
        </form>
      </div>

      {visibleServices.length === 0 ? (
        <section className="border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
            No services found
          </h3>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
            Add services the dispensary offers, or change your search.
          </p>
          <Link
            href="/services/new"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 text-sm font-black text-white shadow-sm transition hover:bg-sky-600"
          >
            <Plus className="h-4 w-4" />
            Add service
          </Link>
        </section>
      ) : (
        <>
          <div className="hidden overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleServices.map((service) => (
                  <tr key={service.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-950/70">
                    <td className="px-4 py-5 align-top">
                      <p className="font-black text-slate-900 dark:text-white">{service.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {service.notes || 'No notes'}
                      </p>
                    </td>

                    <td className="px-4 py-5 align-top font-black text-slate-900 dark:text-white">
                      {service.category}
                    </td>

                    <td className="px-4 py-5 align-top font-black text-slate-900 dark:text-white">
                      {money(service.sellingPrice)}
                    </td>

                    <td className="px-4 py-5 align-top">
                      <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-black text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                        No stock needed
                      </span>
                    </td>

                    <td className="px-4 py-5 align-top">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/products/${service.id}/edit`}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:bg-slate-800 dark:hover:text-sky-200"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <HideItemButton itemId={service.id} itemName={service.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {visibleServices.map((service) => (
              <article
                key={service.id}
                className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-slate-950 dark:text-white">{service.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {service.category}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-black text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                    Service
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Price
                    </p>
                    <p className="mt-1 font-black text-slate-900 dark:text-white">
                      {money(service.sellingPrice)}
                    </p>
                  </div>

                  <div className="border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                      Stock
                    </p>
                    <p className="mt-1 font-black text-slate-900 dark:text-white">
                      Not needed
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/products/${service.id}/edit`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:bg-slate-800 dark:hover:text-sky-200"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  <div className="[&_button]:h-10 [&_button]:w-full">
                    <HideItemButton itemId={service.id} itemName={service.name} />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Showing {visibleServices.length} of {serviceList.length}
            </p>

            {hasMore ? (
              <Link
                href={buildLoadMoreHref(q, take + PAGE_SIZE)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:bg-slate-800 dark:hover:text-sky-200"
              >
                Load more
              </Link>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
