import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { db } from '@dispensary/db/client';
import { products } from '@dispensary/db/schema';
import { ProductForm } from '../../product-form';

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
  });

  if (!product || product.status !== 'ACTIVE') {
    notFound();
  }

  const isService = product.itemType === 'SERVICE';
  const backHref = isService ? '/services' : '/products';

  return (
    <section className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
            {isService ? 'Edit service' : 'Edit product'}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Update details and save changes.
          </p>
        </div>

        <Link
          href={backHref}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:bg-slate-800 dark:hover:text-sky-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {isService ? 'Back to services' : 'Back to products'}
        </Link>
      </div>

      <ProductForm product={product} backHref={backHref} />
    </section>
  );
}
