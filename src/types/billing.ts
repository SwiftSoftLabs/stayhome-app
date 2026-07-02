export type BillingStatus =
  | 'basic'
  | 'pending'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled';

export type BillingPlanRecord = {
  code: string;
  name: string;
  price_cents: number;
  currency: string;
  interval: string | null;
  kelviq_variant_id: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BillingCustomerRecord = {
  user_id: string;
  kelviq_customer_id: string | null;
  kelviq_internal_customer_id: string | null;
  billing_email: string;
  created_at: string;
  updated_at: string;
};

export type UserSubscriptionRecord = {
  id: string;
  user_id: string;
  plan_code: string;
  kelviq_subscription_id: string | null;
  status: BillingStatus;
  unit_price_cents: number;
  currency: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_ends_at: string | null;
  is_manual: boolean;
  past_due_grace_ends_at: string | null;
  kelviq_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BillingSummaryMvp = {
  plan: {
    code: string;
    name: string;
    price_cents: number;
    currency: string;
    interval: string | null;
  };
  status: BillingStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  kelviq_subscription_id: string | null;
  is_manual: boolean;
  prelaunch?: { enabled: boolean; is_tester: boolean };
  availablePlans?: Array<{
    code: string;
    name: string;
    price_cents: number;
    currency: string;
    interval: string | null;
  }>;
};
