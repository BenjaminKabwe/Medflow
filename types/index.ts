export interface SearchParamsProps {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}

export interface PaymentMethodConfigRow {
  id: number;
  method: string;
  label: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  fees: number;
  metadata: unknown;
  created_at: Date;
  updated_at: Date;
}
