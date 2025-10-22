/*
  Teller Phase 5 — Typed Client SDK (Frontend)
  Based solely on teller-phase5-codex/server.js and docs in this repo.
*/

export type BackendMode = 'static' | 'disabled' | 'live';

export interface RuntimeConfig {
  apiBaseUrl: string; // typically '/api'
  FEATURE_USE_BACKEND: boolean;
  FEATURE_MANUAL_DATA: boolean;
  FEATURE_STATIC_DB: boolean;
  backendMode?: BackendMode;
}

export interface HealthzResponse {
  ok: boolean;
  backendUrl: string;
  manualData: {
    enabled: boolean;
    readonly: boolean;
    dryRun: boolean;
    connected: boolean | null;
    summary: null | {
      ok: boolean;
      totals?: { totalAssets: number; totalLiabilities: number; totalEquity: number };
      error?: string;
    };
    error?: string;
  };
}

export interface AccountSummary {
  id: string;
  name: string;
  institution: string;
  last_four: string;
  type: string;
  subtype: string;
  currency: string;
}

export interface AccountsResponse {
  accounts: AccountSummary[];
}

export interface BalanceResponse {
  account_id: string;
  cached_at: string | null;
  balance: Record<string, unknown> & {
    available?: number;
    ledger?: number;
    currency?: string;
  };
}

export interface TransactionItem {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  post_date: string;
  status: string;
  type: string;
  category: string;
}

export interface TransactionsResponse {
  account_id: string;
  cached_at: string | null;
  transactions: TransactionItem[];
}

export interface ManualDataRecord {
  account_id: string;
  rent_roll: number | null;
  updated_at: string | null;
  currency?: string | null;
}

export interface ManualKeyResponse<T = unknown> {
  account_id: string;
  key: string; // e.g., "property.first_floor.rent_amount", "heloc.amount", "mortgage.payment_day"
  value: T | null;
  updated_at: string | null;
  updated_by: string | null;
}

export type LiabilitySlug = 'heloc_loan' | 'original_mortgage_loan_672' | 'roof_loan';

export interface ManualLiability {
  loanAmountUsd: number | null;
  interestRatePct: number | null;
  monthlyPaymentUsd: number | null;
  outstandingBalanceUsd: number | null;
  termMonths: number | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export type ManualLiabilitiesMap = Record<LiabilitySlug, ManualLiability> & Record<string, ManualLiability>;

export interface ManualSummary {
  manual: {
    liabilities: ManualLiabilitiesMap;
    assets: {
      property_672_elm_value: {
        valueUsd: number | null;
        updatedAt: string | null;
        updatedBy: string | null;
      };
      // future assets can be added here without breaking
      [slug: string]: {
        valueUsd: number | null;
        updatedAt: string | null;
        updatedBy: string | null;
      };
    };
  };
  calculated: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  };
}

export interface PutLiabilityPayload {
  loanAmountUsd?: number | null;
  interestRatePct?: number | null;
  monthlyPaymentUsd?: number | null;
  outstandingBalanceUsd?: number | null;
  termMonths?: number | null;
  updatedBy?: string | null;
}

export interface PutLiabilityResponse {
  ok: true;
  liabilities: ManualLiabilitiesMap;
}

export interface PutAssetResponse {
  ok: true;
  asset: {
    slug: string; // property_672_elm_value
    valueUsd: number | null;
    updatedAt: string | null;
    updatedBy: string | null;
  };
}

export interface ClientOptions {
  baseUrl?: string; // default '/api'
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

export class APIClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly _fetch: typeof fetch;

  constructor(opts: ClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? '/api';
    this.defaultHeaders = opts.headers ?? {};
    this._fetch = opts.fetch ?? fetch;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = this.baseUrl.replace(/\/$/, '') + path;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.defaultHeaders,
      ...(init.headers as Record<string, string> | undefined),
    };

    const res = await this._fetch(url, { ...init, headers });
    const text = await res.text();
    const maybeJson = (() => {
      try { return text ? JSON.parse(text) : undefined; } catch { return text; }
    })();
    if (!res.ok) {
      const err: any = new Error(`HTTP ${res.status}: ${res.statusText}`);
      err.status = res.status;
      err.response = maybeJson;
      err.headers = Object.fromEntries(res.headers.entries());
      throw err;
    }
    return (maybeJson as T);
  }

  // ---------- Config & Health ----------
  getConfig(): Promise<RuntimeConfig> {
    return this.request<RuntimeConfig>('/config');
  }

  getHealth(): Promise<HealthzResponse> {
    return this.request<HealthzResponse>('/healthz');
  }

  // ---------- Cached Data ----------
  getAccounts(): Promise<AccountsResponse> {
    return this.request<AccountsResponse>('/db/accounts');
  }

  getBalance(accountId: string): Promise<BalanceResponse> {
    return this.request<BalanceResponse>(`/db/accounts/${encodeURIComponent(accountId)}/balances`);
  }

  getTransactions(accountId: string, limit?: number): Promise<TransactionsResponse> {
    const q = typeof limit === 'number' && isFinite(limit) ? `?limit=${Math.floor(limit)}` : '';
    return this.request<TransactionsResponse>(`/db/accounts/${encodeURIComponent(accountId)}/transactions${q}`);
  }

  // ---------- Manual Rent Roll (per account) ----------
  getManualRentRoll(accountId: string): Promise<ManualDataRecord> {
    return this.request<ManualDataRecord>(`/db/accounts/${encodeURIComponent(accountId)}/manual-data`);
  }

  putManualRentRoll(accountId: string, rentRoll: number | null): Promise<ManualDataRecord> {
    return this.request<ManualDataRecord>(`/db/accounts/${encodeURIComponent(accountId)}/manual-data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rent_roll: rentRoll }),
    });
  }

  // ---------- Manual Property / HELOC / Mortgage ----------
  getManualProperty(
    accountId: string,
    unit: 'first_floor' | 'second_floor' | 'third_floor' | 'barn',
    field: 'rent_amount' | 'tenant_name'
  ): Promise<ManualKeyResponse<number | string | null>> {
    return this.request<ManualKeyResponse<number | string | null>>(
      `/db/accounts/${encodeURIComponent(accountId)}/manual/property/${encodeURIComponent(unit)}/${encodeURIComponent(field)}`
    );
  }

  putManualProperty(
    accountId: string,
    unit: 'first_floor' | 'second_floor' | 'third_floor' | 'barn',
    field: 'rent_amount' | 'tenant_name',
    value: number | string | null,
    updatedBy?: string
  ): Promise<ManualKeyResponse<number | string | null>> {
    return this.request<ManualKeyResponse<number | string | null>>(
      `/db/accounts/${encodeURIComponent(accountId)}/manual/property/${encodeURIComponent(unit)}/${encodeURIComponent(field)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, updated_by: updatedBy ?? null }),
      }
    );
  }

  getManualHeloc(
    accountId: string,
    field: 'amount' | 'interest_rate_pct' | 'term_months' | 'payment_amount'
  ): Promise<ManualKeyResponse<number | null>> {
    return this.request<ManualKeyResponse<number | null>>(
      `/db/accounts/${encodeURIComponent(accountId)}/manual/heloc/${encodeURIComponent(field)}`
    );
  }

  putManualHeloc(
    accountId: string,
    field: 'amount' | 'interest_rate_pct' | 'term_months' | 'payment_amount',
    value: number | null,
    updatedBy?: string
  ): Promise<ManualKeyResponse<number | null>> {
    return this.request<ManualKeyResponse<number | null>>(
      `/db/accounts/${encodeURIComponent(accountId)}/manual/heloc/${encodeURIComponent(field)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, updated_by: updatedBy ?? null }),
      }
    );
  }

  getManualMortgage(
    accountId: string,
    field: 'principal_amount' | 'interest_rate_pct' | 'term_months' | 'payment_day' | 'payment_amount'
  ): Promise<ManualKeyResponse<number | null>> {
    return this.request<ManualKeyResponse<number | null>>(
      `/db/accounts/${encodeURIComponent(accountId)}/manual/mortgage/${encodeURIComponent(field)}`
    );
  }

  putManualMortgage(
    accountId: string,
    field: 'principal_amount' | 'interest_rate_pct' | 'term_months' | 'payment_day' | 'payment_amount',
    value: number | null,
    updatedBy?: string
  ): Promise<ManualKeyResponse<number | null>> {
    return this.request<ManualKeyResponse<number | null>>(
      `/db/accounts/${encodeURIComponent(accountId)}/manual/mortgage/${encodeURIComponent(field)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, updated_by: updatedBy ?? null }),
      }
    );
  }

  // ---------- Manual Slug Summary / Updates ----------
  getManualSummary(): Promise<ManualSummary> {
    return this.request<ManualSummary>('/manual/summary');
  }

  putManualLiability(slug: LiabilitySlug, payload: PutLiabilityPayload): Promise<PutLiabilityResponse> {
    return this.request<PutLiabilityResponse>(`/manual/liabilities/${encodeURIComponent(slug)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
  }

  putManualAsset(valueUsd: number | null, updatedBy?: string): Promise<PutAssetResponse> {
    return this.request<PutAssetResponse>('/manual/assets/property_672_elm_value', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valueUsd, updatedBy: updatedBy ?? null }),
    });
  }
}

