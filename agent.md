# Agent Guide

## Project overview

ShopLedger is a browser-based point-of-sale and shop-ledger application. The backend is an Express application, the frontend is plain HTML/CSS/JavaScript, and application data is persisted in data/db.json.

Before making changes, inspect the relevant source files and follow the existing patterns. This guide is a starting point; the implementation is the source of truth.

## Repository map

- server.js — configures Express, serves public/, mounts the API routers, and serves order invoices.
- public/index.html — browser application page.
- public/js/app.js — frontend behavior and API calls.
- public/css/style.css — application styles.
- routes/products.js — product and coupon endpoints.
- routes/orders.js — order listing, retrieval, creation, and cancellation endpoints.
- routes/customers.js — customer listing and Khata settlement endpoint.
- routes/reports.js — dashboard/GST reports, pricing preview, and admin export endpoints.
- lib/ — business logic:
  - coupons.js — coupon validation and discount calculation.
  - dates.js — date helpers.
  - inventory.js — stock checks, reservation/release, and stock summaries.
  - invoice.js — invoice HTML rendering.
  - ledger.js — customer ledger, credit/Khata, and settlements.
  - orders.js — order operations.
  - pricing.js — subtotal, discount, and total calculation.
  - reports.js — dashboard and GST reconciliation data.
  - store.js — synchronous JSON database read/write and audit-log operations.
  - tax.js — tax-rate resolution and CGST/SGST calculation.
- config.js — application configuration, including shop, tax, coupon, inventory defaults, and admin configuration.
- data/db.json — JSON-backed application data (products, orders, customers, settlements, audit log, and ID counters).
- docs/architecture.svg — repository architecture diagram.

## Request and order flow

1. The browser UI in public/ sends requests to the Express API.
2. server.js mounts the product, order, customer, and report routers under /api.
3. The UI can request POST /api/pricing/preview to preview order totals.
4. Order creation is handled by POST /api/orders in routes/orders.js.
5. The order flow resolves products and checks stock, calculates pricing/coupons/tax, and checks customer credit when Khata is used.
6. Inventory is reserved and the order is added through the order/business-logic modules.
7. Store operations persist the updated JSON data and audit event in data/db.json.
8. The API returns the created order. Invoice HTML is served separately by GET /orders/:id/invoice.

When changing this flow, trace the route and every affected lib/ module. Do not assume that the UI preview and server-side order calculation are interchangeable; verify both paths.

## Working rules

- Keep changes narrowly scoped to the user's request. Do not reformat or rewrite unrelated files.
- Do not add dependencies or change dependency versions unless explicitly requested.
- Do not start the server, run migrations, or perform other state-changing commands unless explicitly requested.
- Inspect package.json before choosing build, test, or lint commands. Do not claim a check passed unless it was actually run.
- Treat data/db.json as application data. Never replace it with sample data or reset it as part of routine development.
- Preserve the existing JSON data shape and ID counters. If changing the schema, explain compatibility and migration implications first.
- Keep business rules in the existing lib/ modules rather than duplicating them in route handlers or frontend code.
- Validate inputs at API boundaries. Escape or safely render user-controlled values in HTML; do not interpolate untrusted values into innerHTML or invoice markup.
- Be careful with inventory and ledger changes: order creation, cancellation, stock reservation/release, and settlements must keep related records consistent.
- Do not expose, copy, or commit secrets. Review admin/configuration behavior before changing it.
- Add or update focused tests when a test setup exists. If no suitable test exists, state what was not verified.

## Before finishing

1. Review the diff and confirm only intended files changed.
2. Check that route paths and response shapes remain compatible with the frontend.
3. Check calculations and persistence behavior for affected order, stock, tax, coupon, and ledger paths.
4. Run only relevant, non-destructive checks that are supported by the repository.
5. Summarize files changed, checks run, and any remaining risks or unverified behavior.
