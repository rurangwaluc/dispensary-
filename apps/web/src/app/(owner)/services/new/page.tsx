import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProductForm } from '../../products/product-form';

export default function NewServicePage() {
  return (
    <section className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
            Add service
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Add work done for customers. Services do not use stock.
          </p>
        </div>

        <Link
          href="/services"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:bg-slate-800 dark:hover:text-sky-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to services
        </Link>
      </div>

      <ProductForm defaultItemType="SERVICE" backHref="/services" />
    </section>
  );
}
