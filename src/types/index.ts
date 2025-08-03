export interface ErrorLog {
  id?: string;
  user_id: string;
  timestamp: string;
  integration_name: string;
  error_type: string;
  error_message: string;
  raw_payload: Record<string, unknown>;
  created_at?: string;
  resolved?: boolean;
  retry_count?: number;
  last_retry_at?: string;
  retry_results?: RetryResult[];
}

export interface RetryResult {
  timestamp: string;
  success: boolean;
  message: string;
  response?: Record<string, unknown>;
}

export interface DashboardStats {
  totalErrors: number;
  mostCommonErrorType: string;
  totalIntegrations: number;
}

export interface WebhookPayload {
  userId: string;
  timestamp: string;
  integrationName: string;
  errorType: string;
  errorMessage: string;
  rawPayload: Record<string, unknown>;
}