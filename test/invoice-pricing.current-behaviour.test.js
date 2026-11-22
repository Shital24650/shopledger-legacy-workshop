const test = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');

function orderFor(items, coupon = '') {
  return { id: 1, coupon, items };
}

test('invoice uses the same HSN slab and GST as checkout when gstRate is absent', () => {
  const items = [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 1000, qty: 1 }];
  const billed = pricing.computeTotals(items, '');
  const printed = invoice.computeInvoiceFigures(orderFor(items));

  assert.equal(billed.tax, 50);
  assert.equal(billed.total, 1050);
  assert.equal(printed.tax, billed.tax);
  assert.equal(printed.total, billed.total);
  assert.equal(printed.rows[0].gstPercent, billed.lines[0].gstPercent);
});

test('invoice applies coupon discount before GST, matching checkout', () => {
  const items = [{ id: 2, name: 'Rice', sku: 'RICE-2', hsn: '1006', price: 1000, qty: 1 }];
  const billed = pricing.computeTotals(items, 'WELCOME');
  const printed = invoice.computeInvoiceFigures(orderFor(items, 'WELCOME'));

  assert.equal(billed.discount, 50);
  assert.equal(billed.tax, 47.5);
  assert.equal(billed.total, 997.5);
  assert.equal(printed.tax, billed.tax);
  assert.equal(printed.discount, billed.discount);
  assert.equal(printed.total, billed.total);
});

test('invoice enforces the coupon maxDiscount, matching checkout', () => {
  const items = [{ id: 3, name: 'Tea', sku: 'TEA-3', hsn: '0902', price: 2000, qty: 1 }];
  const billed = pricing.computeTotals(items, 'SAVE10');
  const printed = invoice.computeInvoiceFigures(orderFor(items, 'SAVE10'));

  assert.equal(billed.discount, 150);
  assert.equal(printed.discount, billed.discount);
  assert.equal(billed.total, 2183);
  assert.equal(printed.total, billed.total);
});

test('invoice honors an explicit gstRate using the checkout tax resolver', () => {
  const items = [{ id: 4, name: 'Rice', sku: 'RICE-4', hsn: '1006', gstRate: 12, price: 100, qty: 1 }];
  const billed = pricing.computeTotals(items, '');
  const printed = invoice.computeInvoiceFigures(orderFor(items));

  assert.equal(billed.tax, 12);
  assert.equal(printed.tax, 12);
  assert.equal(printed.rows[0].gstPercent, 12);
});

test('invoice line GST uses the coupon-discounted taxable value from checkout', () => {
  const items = [{ id: 5, name: 'Tea', sku: 'TEA-5', hsn: '0902', price: 1000, qty: 1 }];
  const billed = pricing.computeTotals(items, 'WELCOME');
  const printed = invoice.computeInvoiceFigures(orderFor(items, 'WELCOME'));

  assert.equal(billed.lines[0].taxable, 950);
  assert.equal(billed.lines[0].tax, 171);
  assert.equal(printed.rows[0].lineTax, billed.lines[0].tax);
});


test('invoice matches checkout GST, discount, CGST/SGST and total for HSN and coupon orders', () => {
  const cases = [
    { items: [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 1000, qty: 1 }], coupon: '' },
    { items: [{ id: 2, name: 'Rice', sku: 'RICE-2', hsn: '1006', price: 1000, qty: 1 }], coupon: 'WELCOME' },
    { items: [{ id: 3, name: 'Tea', sku: 'TEA-3', hsn: '0902', price: 2000, qty: 1 }], coupon: 'SAVE10' }
  ];

  for (const sample of cases) {
    const checkout = pricing.computeTotals(sample.items, sample.coupon);
    const printed = invoice.computeInvoiceFigures(orderFor(sample.items, sample.coupon));
    assert.equal(printed.subtotal, checkout.subtotal);
    assert.equal(printed.discount, checkout.discount);
    assert.equal(printed.tax, checkout.tax);
    assert.equal(printed.cgst, checkout.cgst);
    assert.equal(printed.sgst, checkout.sgst);
    assert.equal(printed.total, checkout.total);
    assert.deepEqual(
      printed.rows.map(row => ({ gstPercent: row.gstPercent, lineTax: row.lineTax })),
      checkout.lines.map(line => ({ gstPercent: line.gstPercent, lineTax: line.tax }))
    );
  }
});
