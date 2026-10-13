import type { TaxSnapshot } from "@/lib/tax-types";
export default function CheckoutTaxSummary({ tax }: { tax: TaxSnapshot }) {
  const money = (n: number) => "₹" + (n / 100).toFixed(2);
  const goods = tax.lines
    .filter((line) => line.kind === "product")
    .reduce((sum, line) => sum + line.total, 0);
  return (
    <dl className="space-y-2 text-xs text-slate-600">
      <div className="flex justify-between gap-3">
        <dt>Items after discounts, including GST</dt>
        <dd>{money(goods)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt>Shipping, including applicable GST</dt>
        <dd>{money(tax.shipping)}</dd>
      </div>
      {tax.roundOff !== 0 && (
        <div className="flex justify-between gap-3">
          <dt>Round-off</dt>
          <dd>{money(tax.roundOff)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-3">
        <dt>GST included above</dt>
        <dd>{money(tax.tax)}</dd>
      </div>
      {tax.discount > 0 && (
        <div className="flex justify-between gap-3">
          <dt>Discounts already applied to listed prices</dt>
          <dd>{money(tax.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-3">
        <dt>Place of supply</dt>
        <dd>
          {tax.placeOfSupply.state} ({tax.placeOfSupply.code})
        </dd>
      </div>
    </dl>
  );
}
