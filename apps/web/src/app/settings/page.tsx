import { db } from '@dispensary/db/client';
import { AppHeader } from '@/components/app-header';
import { requireOwner } from '@/lib/auth/session';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  await requireOwner();

  const settings = await db.query.businessSettings.findFirst();

  const safeSettings = {
    businessName: settings?.businessName || 'Dispensary Manager',
    ownerName: settings?.ownerName || 'Owner',
    phone: settings?.phone || '',
    address: settings?.address || '',
    currency: settings?.currency || 'RWF',
    lowStockAlertQuantity: settings?.lowStockAlertQuantity || '5',
    expiryAlertDays: settings?.expiryAlertDays || '60',
  };

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-3 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-5 sm:py-5 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-5">
        <AppHeader eyebrow="Settings" title="Business settings" />

        <section className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
              What these settings control
            </h2>
            <div className="mt-5 divide-y divide-slate-100 text-sm dark:divide-slate-800">
              <div className="py-3">
                <p className="font-black text-slate-800 dark:text-slate-200">Dashboard labels</p>
                <p className="mt-1 font-medium leading-6 text-slate-500 dark:text-slate-400">
                  Business and owner identity across the system.
                </p>
              </div>
              <div className="py-3">
                <p className="font-black text-slate-800 dark:text-slate-200">Stock warnings</p>
                <p className="mt-1 font-medium leading-6 text-slate-500 dark:text-slate-400">
                  When a product should be shown as low stock.
                </p>
              </div>
              <div className="py-3">
                <p className="font-black text-slate-800 dark:text-slate-200">Expiry warnings</p>
                <p className="mt-1 font-medium leading-6 text-slate-500 dark:text-slate-400">
                  How early drugs should appear as expiring soon.
                </p>
              </div>
            </div>
          </aside>

          <section className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="mb-5 border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
                Main business details
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Keep this simple. These details will support reports and alerts later.
              </p>
            </div>

            <SettingsForm settings={safeSettings} />
          </section>
        </section>
      </div>
    </main>
  );
}
