# Cohort Analytics — Achievable Functionality

## Overview

This document describes what subscription and revenue analytics can be built using payment notifications from Breeze (our payment provider), combined with data we already capture in the product funnel.

The goal is to define **cohorts** — groups of customers who started on the same date or date range — and measure how those groups behave over time: who cancels during trial, who pays again, who buys upsells, who triggers refunds or disputes, and how much revenue they generate.

**Cohort anchor:** A customer is considered *acquired* on the date their subscription was created (when they completed checkout and entered trial or billing).

---

## What We Can Measure

| Metric | Description |
|--------|-------------|
| **In-trial cancel rate** | Share of a cohort who cancel before their first paid billing cycle |
| **First billing retention** | Share of a cohort who successfully pay for a second billing cycle |
| **Second billing retention** | Share of a cohort who successfully pay for a third billing cycle |
| **Upsell rate** | Share of a cohort who purchase at least one add-on (Weakness Report, Genius Blueprint, Brain Coach) |
| **Revenue** | Total and per-customer revenue from subscriptions and one-time purchases |
| **Refunds** | Refund count and amount tied to a cohort |
| **Disputes** | Chargeback/dispute count and outcomes tied to a cohort |
| **Grace period & suspension rate** | Share of a cohort who miss a payment and enter grace period or suspension |
| **Payment failure rate** | Share of checkout attempts that fail before a successful payment |

---

## How Information Is Retrieved

Breeze sends automatic notifications to our server whenever something important happens in a customer’s billing lifecycle — subscription status changes, invoices paid or missed, payments succeeding or failing, refunds processed, and (once enabled) disputes opened or resolved.

Our server receives these notifications in real time and records them as a chronological history per customer and subscription. That history is the foundation for all cohort metrics.

For customers who signed up before we started recording this history, we can reconstruct past billing activity by requesting their subscription and payment records directly from Breeze.

Some dimensions — such as marketing campaign or funnel step — are not included in payment notifications. Those come from our existing product analytics (PostHog) and assessment session data, linked to the same customer by email or session identifier.

---

## Cohort Filters

Each analysis can be narrowed by one or more of the following:

| Filter | Source |
|--------|--------|
| **Acquisition date or date range** | Subscription creation date |
| **Billing plan** | Monthly IQ subscription ($29.99/month baseline; $29.98/month BOA; $29.97/month RVR) |
| **Payment method** | Card, Apple Pay, or Google Pay (from the first successful charge) |
| **Trial type** | Discounted trial ($1.00): **3 days** on default/BOA/RVR/short-IQ funnels, **1 week** on alt (unless plan-specific override); variants bill at their configured monthly price after trial |
| **Marketing campaign** | UTM parameters captured at funnel entry (PostHog) |
| **Funnel variant** | Which checkout or onboarding flow the customer used |

---

## Scenarios

### Scenario 1: In-trial cancel rate by plan and acquisition week

**Question:** Of customers who subscribed between March 1 and March 7 on the monthly plan, what percentage cancelled before their first bill?

**How it works:**

1. Identify all subscriptions created in that date range on the monthly plan.
2. For each subscription, track whether the customer ever reached an active paid status or cancelled while still in trial.
3. Divide cancellations during trial by total subscriptions in the cohort.

**Output:** A percentage, optionally broken down by day of acquisition within the week.

---

### Scenario 2: First billing retention by payment method

**Question:** Of customers acquired March 1–7 who paid with Apple Pay, what percentage successfully paid their second billing cycle?

**How it works:**

1. Build the cohort from subscriptions created in that date range.
2. For each customer, identify how they paid on their first successful charge (card, Apple Pay, or Google Pay).
3. Keep only customers whose first payment method was Apple Pay.
4. Count how many of those customers also had a second successful billing cycle payment.
5. Divide by the filtered cohort size.

**Output:** Retention percentage for Apple Pay vs card vs Google Pay, comparable side by side.

---

### Scenario 3: Second billing retention by acquisition month

**Question:** What percentage of January acquisitions are still paying by their third billing cycle?

**How it works:**

1. Group all subscriptions created in January into one cohort.
2. For each subscription, count how many billing cycles were successfully paid.
3. Measure the share with at least three paid cycles.

**Output:** Monthly retention curve — useful for comparing January vs February vs March cohorts as they mature.

---

### Scenario 4: Upsell rate within a subscription cohort

**Question:** Of customers who subscribed in a given week, how many also bought the Weakness Report or Brain Coach?

**How it works:**

1. Define the cohort by subscription creation date.
2. Look up whether the same customer later completed a one-time purchase for an add-on product.
3. Calculate the percentage who bought at least one upsell, and optionally break down by which product.

**Output:** Overall upsell rate and per-product attach rates for the cohort.

---

### Scenario 5: Revenue per cohort

**Question:** How much total revenue did the March 1–7 cohort generate, including renewals and upsells?

**How it works:**

1. Define the cohort by subscription creation date.
2. Sum all successful subscription charges and one-time purchases linked to customers in that cohort, from acquisition through the present (or a chosen end date).
3. Optionally split into subscription revenue vs upsell revenue vs tax.

**Output:** Total revenue, average revenue per customer, and revenue over time (e.g. week 1, week 2, week 4 after acquisition).

---

### Scenario 6: Refund rate and refund amount by cohort

**Question:** What share of a cohort received a refund, and how much was refunded?

**How it works:**

1. Define the cohort by subscription creation date.
2. Match refund notifications to payments made by customers in that cohort.
3. Count customers with at least one refund and sum refund amounts.

**Output:** Refund rate (% of cohort), total refunded dollars, average refund size.

---

### Scenario 7: Dispute rate by cohort

**Question:** How many customers in a cohort opened a chargeback or dispute?

**How it works:**

1. Define the cohort by subscription creation date.
2. Match dispute notifications to payments made by customers in that cohort.
3. Track dispute status over time (received, won, lost, resolved).

**Output:** Dispute rate, total disputed amount, win/loss breakdown.

**Note:** Dispute notifications must be enabled with Breeze support before this data is available.

---

### Scenario 8: Cohort comparison by marketing campaign

**Question:** Do customers from a Facebook campaign retain better than customers from Google Ads?

**How it works:**

1. Define subscription cohorts by acquisition date as usual.
2. Enrich each customer with the UTM campaign captured when they entered the funnel (from PostHog).
3. Run any retention or revenue metric from the scenarios above, grouped by campaign.

**Output:** Side-by-side retention or revenue comparison by traffic source or campaign.

---

### Scenario 9: Payment failure before conversion

**Question:** What percentage of checkout attempts fail before a customer successfully subscribes?

**How it works:**

1. Track failed payment attempts and successful payments for customers entering checkout in a date range.
2. Measure how many customers needed multiple attempts before succeeding, and how many never converted.

**Output:** First-attempt success rate, overall conversion after retries.

**Note:** Detailed payment-failure notifications may need to be enabled with Breeze support.

---

### Scenario 10: Grace period and involuntary churn

**Question:** Of customers who missed a renewal payment, how many recovered vs were suspended?

**How it works:**

1. Identify subscriptions that entered a grace period (missed payment but still active).
2. Track whether each subscription returned to active (payment recovered) or moved to suspended (involuntary churn).
3. Group by acquisition cohort and billing plan.

**Output:** Involuntary churn rate vs voluntary cancel rate, broken down by cohort.

---

## Data We Do Not Get From Payment Notifications Alone

The following require joining payment data with other sources:

| Need | Where it comes from |
|------|---------------------|
| Marketing campaign (UTM) | PostHog events at funnel entry |
| Funnel step or variant | PostHog + assessment session records |
| Demographics (gender, IQ score) | Assessment and profile data in our database |
| In-app engagement after signup | PostHog dashboard events |

These can still be used as **cohort filters or breakdowns** once linked to the same customer.

---

## Limitations and Assumptions

- **Acquisition date** is defined as subscription creation date, not funnel start or first page visit. Funnel-start cohorts are possible but require joining with PostHog or session data.
- **Retention milestones** (first vs second billing) should be defined consistently — e.g. whether the $1.00 discounted-trial charge counts as the first billing cycle. This should be agreed before building dashboards.
- **Historical data** before we begin recording payment notifications can be backfilled from Breeze, but may require a one-time import effort.
- **Disputes, fraud reports, and detailed payment failures** require Breeze to enable additional notification types on our account.
- Payment notifications can occasionally be delivered more than once; all metrics should treat duplicate events safely so numbers stay accurate.

---

## Summary

Using Breeze payment notifications as the primary data source — supplemented by funnel analytics and customer session data where needed — we can support a full cohort analytics program covering trial conversion, billing retention, upsell attach, revenue, refunds, disputes, and campaign-level comparisons.

The scenarios above represent the core analyses the business has asked for. Storage, tooling, and dashboard design are separate decisions to be made once this scope is approved.
