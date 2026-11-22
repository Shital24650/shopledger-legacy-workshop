const test = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');

function orderFor(items, coupon = '') {
  return { id: 1, coupon, items };
}

test('CURRENT BEHAVIOUR: pricing uses the HSN slab, while invoice defaults to 18% when gstRate is absent', () => {
  const items = [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 1000, qty: 1 }];
  const billed = pricing.computeTotals(items, '');
  const printed = invoice.computeInvoiceFigures(orderFor(items));

  assert.equal(billed.tax, 50);
  assert.equal(billed.total, 1050);
  assert.equal(printed.tax, 180);
  assert.equal(printed.total, 1180);
  assert.equal(printed.rows[0].gstPercent, 18);
});

test('CURRENT BEHAVIOUR: pricing applies coupon discount before GST; invoice discounts subtotal plus GST', () => {
  const items = [{ id: 2, name: 'Rice', sku: 'RICE-2', hsn: '1006', price: 1000, qty: 1 }];
  const billed = pricing.computeTotals(items, 'WELCOME');
  const printed = invoice.computeInvoiceFigures(orderFor(items, 'WELCOME'));

  assert.equal(billed.discount, 50);
  assert.equal(billed.tax, 47.5);
  assert.equal(billed.total, 997.5);
  assert.equal(printed.tax, 180);
  assert.equal(printed.discount, 59);
  assert.equal(printed.total, 1121);
});

test('CURRENT BEHAVIOUR: pricing enforces coupon maxDiscount; invoice percentage discount does not', () => {
  const items = [{ id: 3, name: 'Tea', sku: 'TEA-3', hsn: '0902', price: 2000, qty: 1 }];
  const billed = pricing.computeTotals(items, 'SAVE10');
  const printed = invoice.computeInvoiceFigures(orderFor(items, 'SAVE10'));

  assert.equal(billed.discount, 150);
  assert.equal(printed.discount, 236);
  assert.equal(billed.total, 2183);
  assert.equal(printed.total, 2124);
});

test('CURRENT BEHAVIOUR: invoice honors an explicit gstRate as a percentage, independently of the HSN slab', () => {
  const items = [{ id: 4, name: 'Rice', sku: 'RICE-4', hsn: '1006', gstRate: 12, price: 100, qty: 1 }];
  const billed = pricing.computeTotals(items, '');
  const printed = invoice.computeInvoiceFigures(orderFor(items));

  assert.equal(billed.tax, 12);
  assert.equal(printed.tax, 12);
  assert.equal(printed.rows[0].gstPercent, 12);
});

test('CURRENT BEHAVIOUR: invoice line GST is calculated on gross line value, not coupon-discounted taxable value', () => {
  const items = [{ id: 5, name: 'Tea', sku: 'TEA-5', hsn: '0902', price: 1000, qty: 1 }];
  const billed = pricing.computeTotals(items, 'WELCOME');
  const printed = invoice.computeInvoiceFigures(orderFor(items, 'WELCOME'));

  assert.equal(billed.lines[0].taxable, 950);
  assert.equal(billed.lines[0].tax, 171);
  assert.equal(printed.rows[0].lineTax, 180);
});
