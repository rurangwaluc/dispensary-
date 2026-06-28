import Link from 'next/link';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@dispensary/db/client';
import {
  businessSettings,
  debtPayments,
  expenses,
  products,
  saleItems,
  sales,
} from '@dispensary/db/schema';

type ReportsPageProps = {
  searchParams?: Promise<{
    range?: string;
  }>;
};

type RangeKey = 'today' | 'month' | 'all';

function money(value: string | number) {
  return `RWF ${Number(value).toLocaleString('en-US')}`;
}

function paymentName(value: string) {
  const names: Record<string, string> = {
    CASH: 'Cash',
    MOBILE_MONEY: 'Mobile money',
    BANK: 'Bank',
    CARD: 'Card',
  };

  return names[value] || value;
}

function getRangeLabel(range: RangeKey) {
  if (range === 'today') {
    return 'Today';
  }

  if (range === 'month') {
    return 'This month';
  }

  return 'All time';
}

function isInsideRange(value: Date, range: RangeKey) {
  if (range === 'all') {
    return true;
  }

  const today = new Date();

  if (range === 'today') {
    return (
      value.getFullYear() === today.getFullYear() &&
      value.getMonth() === today.getMonth() &&
      value.getDate() === today.getDate()
    );
  }

  return value.getFullYear() === today.getFullYear() && value.getMonth() === today.getMonth();
}

function getExpiryWarning(expiryDate: string | null, warningDays: number) {
  if (!expiryDate) {
    return false;
  }

  const today = new Date();
  const expiry = new Date(`${expiryDate}T00:00:00`);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);

  return daysLeft >= 0 && daysLeft <= warningDays;
}

function rangeHref(range: RangeKey) {
  return `/reports?range=${range}`;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const range: RangeKey =
    params?.range === 'month' || params?.range === 'all' || params?.range === 'today'
      ? params.range
      : 'today';

  const [settings] = await db.select().from(businessSettings).limit(1);
  const [saleList, expenseList, debtPaymentList, productList] = await Promise.all([
    db.select().from(sales),
    db.select().from(expenses),
    db.select().from(debtPayments),
    db.select().from(products).where(eq(products.status, 'ACTIVE')),
  ]);

  const filteredSales = saleList.filter((sale) => isInsideRange(sale.saleDate, range));
  const filteredExpenses = expenseList.filter((expense) => isInsideRange(expense.expenseDate, range));
  const filteredDebtPayments = debtPaymentList.filter((payment) => isInsideRange(payment.paidAt, range));

  const saleIds = filteredSales.map((sale) => sale.id);
  const itemList =
    saleIds.length > 0
      ? await db.select().from(saleItems).where(inArray(saleItems.saleId, saleIds))
      : [];

  const productMap = new Map(productList.map((product) => [product.id, product]));

  const salesTotal = filteredSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const salesPaid = filteredSales.reduce((sum, sale) => sum + Number(sale.paidAmount), 0);
  const creditGiven = filteredSales.reduce((sum, sale) => sum + Number(sale.balanceAmount), 0);
  const debtPaid = filteredDebtPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const expensesTotal = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const moneyReceived = salesPaid + debtPaid;

  const productCost = itemList.reduce((sum, item) => {
    if (item.itemType === 'SERVICE') {
      return sum;
    }

    const product = productMap.get(item.productId);
    return sum + Number(product?.buyingPrice || 0) * item.quantity;
  }, 0);

  const profitEstimate = salesTotal - productCost - expensesTotal;

  const expiryWarningDays = Number(settings?.expiryAlertDays || 60);
  const activeProducts = productList.filter((product) => product.itemType === 'PRODUCT');

  const lowStock = activeProducts.filter((product) => product.quantity <= product.minQuantity);
  const expiringSoon = activeProducts.filter((product) =>
    getExpiryWarning(product.expiryDate, expiryWarningDays),
  );

  const soldProducts = itemList
    .filter((item) => item.itemType === 'PRODUCT')
    .reduce<Map<string, { name: string; quantity: number; total: number }>>((map, item) => {
      const current = map.get(item.productId) || {
        name: item.itemName,
        quantity: 0,
        total: 0,
      };

      current.quantity += item.quantity;
      current.total += Number(item.lineTotal);
      map.set(item.productId, current);

      return map;
    }, new Map());

  const soldServices = itemList
    .filter((item) => item.itemType === 'SERVICE')
    .reduce<Map<string, { name: string; quantity: number; total: number }>>((map, item) => {
      const current = map.get(item.productId) || {
        name: item.itemName,
        quantity: 0,
        total: 0,
      };

      current.quantity += item.quantity;
      current.total += Number(item.lineTotal);
      map.set(item.productId, current);

      return map;
    }, new Map());

  const productRows = Array.from(soldProducts.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const serviceRows = Array.from(soldServices.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const paymentRows = ['CASH', 'MOBILE_MONEY', 'BANK', 'CARD'].map((method) => {
    const saleMoney = filteredSales
      .filter((sale) => sale.paymentMethod === method)
      .reduce((sum, sale) => sum + Number(sale.paidAmount), 0);

    const debtMoney = filteredDebtPayments
      .filter((payment) => payment.paymentMethod === method)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    return {
      method,
      name: paymentName(method),
      total: saleMoney + debtMoney,
    };
  });

  const expenseRows = filteredExpenses.reduce<Map<string, number>>((map, expense) => {
    const current = map.get(expense.category) || 0;
    map.set(expense.category, current + Number(expense.amount));
    return map;
  }, new Map());

  const expenseCategoryRows = Array.from(expenseRows.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const summary = [
    { label: 'Sales', value: money(salesTotal), helper: 'Products and services sold' },
    { label: 'Money received', value: money(moneyReceived), helper: 'Sales paid plus debt paid' },
    { label: 'Unpaid', value: money(creditGiven), helper: 'Money customers still owe' },
    { label: 'Expenses', value: money(expensesTotal), helper: 'Money spent' },
    { label: 'Profit estimate', value: money(profitEstimate), helper: 'Sales minus cost and expenses' },
    { label: 'Sales count', value: filteredSales.length, helper: 'Number of sales' },
    { label: 'Low stock', value: lowStock.length, helper: 'Products needing restock' },
    { label: 'Expiring soon', value: expiringSoon.length, helper: `${expiryWarningDays} days warning` },
  ];

  const ranges: { label: string; value: RangeKey }[] = [
    { label: 'Today', value: 'today' },
    { label: 'This month', value: 'month' },
    { label: 'All time', value: 'all' },
  ];

  return (
    <section className="space-y-4">
      <div className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
              Reports
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
              See what came in, what went out, what sold, and what needs attention.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {ranges.map((item) => (
              <Link
                key={item.value}
                href={rangeHref(item.value)}
                className={
                  item.value === range
                    ? 'inline-flex h-10 items-center justify-center rounded-lg border border-sky-300 bg-sky-50 px-4 text-sm font-black text-sky-800 dark:border-sky-500 dark:bg-sky-500 dark:text-white'
                    : 'inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:bg-slate-800 dark:hover:text-sky-200'
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summary.map((item) => (
          <article
            key={item.label}
            className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              {item.label}
            </p>
            <p
              className={
                item.label === 'Profit estimate' && Number(profitEstimate) < 0
                  ? 'mt-3 text-xl font-black tracking-tight text-red-700 dark:text-red-300 sm:text-2xl'
                  : 'mt-3 text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl'
              }
            >
              {item.value}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
              {item.helper}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-black text-slate-950 dark:text-white">
            Money received by method
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {getRangeLabel(range)}
          </p>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {paymentRows.map((row) => (
              <div key={row.method} className="flex items-center justify-between gap-4 py-3">
                <p className="font-black text-slate-900 dark:text-white">{row.name}</p>
                <p className="font-black text-green-700 dark:text-green-300">{money(row.total)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-black text-slate-950 dark:text-white">
            Expenses by category
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {getRangeLabel(range)}
          </p>

          {expenseCategoryRows.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
              No expenses in this period.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {expenseCategoryRows.map((row) => (
                <div key={row.category} className="flex items-center justify-between gap-4 py-3">
                  <p className="font-black text-slate-900 dark:text-white">{row.category}</p>
                  <p className="font-black text-red-700 dark:text-red-300">{money(row.total)}</p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-black text-slate-950 dark:text-white">Top products sold</h3>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Products only
          </p>

          {productRows.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
              No products sold in this period.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {productRows.map((row) => (
                <div key={row.name} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">{row.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Quantity sold: {row.quantity}
                    </p>
                  </div>
                  <p className="font-black text-slate-900 dark:text-white">{money(row.total)}</p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-black text-slate-950 dark:text-white">Top services sold</h3>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Services only
          </p>

          {serviceRows.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
              No services sold in this period.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {serviceRows.map((row) => (
                <div key={row.name} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">{row.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Times sold: {row.quantity}
                    </p>
                  </div>
                  <p className="font-black text-slate-900 dark:text-white">{money(row.total)}</p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-black text-slate-950 dark:text-white">Products to restock</h3>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
              No low stock products.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {lowStock.slice(0, 10).map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-4 py-3">
                  <p className="font-black text-slate-900 dark:text-white">{product.name}</p>
                  <p className="font-black text-yellow-700 dark:text-yellow-300">
                    {product.quantity} {product.unit}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-black text-slate-950 dark:text-white">Expiring soon</h3>
          {expiringSoon.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
              No product is expiring soon.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {expiringSoon.slice(0, 10).map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-4 py-3">
                  <p className="font-black text-slate-900 dark:text-white">{product.name}</p>
                  <p className="font-black text-yellow-700 dark:text-yellow-300">
                    {product.expiryDate || 'No date'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </section>
  );
}
