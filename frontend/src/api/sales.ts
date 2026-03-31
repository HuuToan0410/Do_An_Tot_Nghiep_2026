import api from "./client";

// ── Interfaces ─────────────────────────────────────────────────

export interface Pricing {
  id: number;
  vehicle: number;
  vehicle_name: string;
  purchase_price: string;
  refurbish_cost: string;
  other_cost: string;
  suggested_price: string;
  approved_price: string | null;
  approved_by: number | null;
  approved_by_name: string;
  approved_at: string | null;
  total_cost: string;
  expected_margin: string;
  margin_percent: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface PricingPayload {
  vehicle: number;
  purchase_price: number;
  refurbish_cost?: number;
  other_cost?: number;
  suggested_price: number;
  note?: string;
}

export interface Listing {
  id: number;
  vehicle: number;
  vehicle_name: string;
  title: string;
  slug: string;
  description: string;
  listed_price: string;
  is_active: boolean;
  is_featured: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface ListingPayload {
  vehicle: number;
  title: string;
  description: string;
  listed_price: number;
  is_active?: boolean;
  is_featured?: boolean;
}

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  id: number;
  vehicle: number;
  vehicle_name: string;
  customer: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  scheduled_at: string;
  status: AppointmentStatus;
  status_display: string;
  note: string;
  handled_by: number | null;
  handled_by_name: string;
  created_at: string;
}

export interface AppointmentPayload {
  vehicle: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  scheduled_at: string;
  note?: string;
}

export type DepositStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "REFUNDED"
  | "CONVERTED";

export interface Deposit {
  id: number;
  vehicle: number;
  vehicle_name: string;
  customer: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  amount: string;
  status: DepositStatus;
  status_display: string;
  note: string;
  confirmed_by: number | null;
  confirmed_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface DepositPayload {
  vehicle: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  amount: number;
  note?: string;
}

export interface SalesOrder {
  id: number;
  vehicle: number;
  vehicle_name: string;
  customer: number | null;
  customer_name: string;
  customer_phone: string;
  deposit: number | null;
  sale_price: string;
  contract_number: string;
  sold_by: number | null;
  sold_by_name: string;
  note: string;
  sold_at: string;
}

export interface SalesOrderPayload {
  vehicle: number;
  customer_name: string;
  customer_phone: string;
  deposit?: number;
  sale_price: number;
  contract_number: string;
  note?: string;
}

export interface HandoverRecord {
  id: number;
  sales_order: number;
  handover_date: string;
  mileage_at_handover: number;
  staff: number | null;
  note: string;
  customer_signature: string | null;
  created_at: string;
}

export interface WarrantyRecord {
  id: number;
  sales_order: number;
  warranty_months: number;
  max_mileage: number;
  coverage_note: string;
  status: "ACTIVE" | "EXPIRED" | "VOID";
  status_display: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

// ── Pricing API ────────────────────────────────────────────────

export async function getPricingList(): Promise<Pricing[]> {
  const res = await api.get("/pricing/");
  return res.data?.results ?? res.data;
}

export async function getPricingDetail(id: number): Promise<Pricing> {
  const res = await api.get(`/pricing/${id}/`);
  return res.data;
}

export async function createPricing(data: PricingPayload): Promise<Pricing> {
  const res = await api.post("/pricing/create/", data);
  return res.data;
}

export async function updatePricing(
  id: number,
  data: Partial<PricingPayload>
): Promise<Pricing> {
  const res = await api.patch(`/pricing/${id}/`, data);
  return res.data;
}

export async function approvePricing(
  id: number,
  approvedPrice: number,
  note?: string
): Promise<{ message: string; approved_price: string; margin: string }> {
  const res = await api.post(`/pricing/${id}/approve/`, {
    approved_price: approvedPrice,
    note,
  });
  return res.data;
}

// ── Listing API ────────────────────────────────────────────────

export async function getListings(): Promise<Listing[]> {
  const res = await api.get("/listings/");
  return res.data?.results ?? res.data;
}

export async function getListingDetail(id: number): Promise<Listing> {
  const res = await api.get(`/listings/${id}/`);
  return res.data;
}

export async function createListing(data: ListingPayload): Promise<Listing> {
  const res = await api.post("/listings/create/", data);
  return res.data;
}

export async function updateListing(
  id: number,
  data: Partial<ListingPayload>
): Promise<Listing> {
  const res = await api.patch(`/listings/${id}/`, data);
  return res.data;
}

export async function deleteListing(id: number): Promise<void> {
  await api.delete(`/listings/${id}/`);
}

// ── Appointment API ────────────────────────────────────────────

export async function getAppointments(params?: {
  vehicle?: number;
  status?: string;
}): Promise<Appointment[]> {
  const res = await api.get("/appointments/", { params });
  return res.data?.results ?? res.data;
}

export async function createAppointment(
  data: AppointmentPayload
): Promise<Appointment> {
  const res = await api.post("/appointments/", data);
  return res.data;
}

export async function updateAppointment(
  id: number,
  data: { status: AppointmentStatus; note?: string }
): Promise<Appointment> {
  const res = await api.patch(`/appointments/${id}/`, data);
  return res.data;
}

// ── Deposit API ────────────────────────────────────────────────
// Thêm 2 interface mới TRƯỚC hàm getDeposits:
export interface DepositListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
}

export interface DepositListResponse {
  results: Deposit[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Thay hàm getDeposits cũ:
export async function getDeposits(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
}): Promise<DepositListResponse | Deposit[]> {
  const res = await api.get("/deposits/", { params });
  return res.data;
}

export async function getDepositDetail(id: number): Promise<Deposit> {
  const res = await api.get(`/deposits/${id}/`);
  return res.data;
}

export async function createDeposit(data: DepositPayload): Promise<Deposit> {
  const res = await api.post("/deposits/", data);
  return res.data;
}

export async function confirmDeposit(
  id: number
): Promise<{ message: string }> {
  const res = await api.post(`/deposits/${id}/confirm/`);
  return res.data;
}

export async function cancelDeposit(
  id: number
): Promise<{ message: string }> {
  const res = await api.post(`/deposits/${id}/cancel/`);
  return res.data;
}

// ── Sales Order API ────────────────────────────────────────────

export async function getSalesOrders(): Promise<SalesOrder[]> {
  const res = await api.get("/sales-orders/");
  return res.data?.results ?? res.data;
}

export async function getSalesOrderDetail(id: number): Promise<SalesOrder> {
  const res = await api.get(`/sales-orders/${id}/`);
  return res.data;
}

export async function createSalesOrder(
  data: SalesOrderPayload
): Promise<SalesOrder> {
  const res = await api.post("/sales-orders/", data);
  return res.data;
}

// ── Handover API ───────────────────────────────────────────────

export async function createHandover(data: {
  sales_order: number;
  handover_date: string;
  mileage_at_handover: number;
  note?: string;
}): Promise<HandoverRecord> {
  const res = await api.post("/handovers/", data);
  return res.data;
}

export async function getHandoverDetail(id: number): Promise<HandoverRecord> {
  const res = await api.get(`/handovers/${id}/`);
  return res.data;
}

// ── Warranty API ───────────────────────────────────────────────

export async function getWarranties(): Promise<WarrantyRecord[]> {
  const res = await api.get("/warranties/");
  return res.data?.results ?? res.data;
}

export async function getWarrantyDetail(id: number): Promise<WarrantyRecord> {
  const res = await api.get(`/warranties/${id}/`);
  return res.data;
}

export async function createWarranty(data: {
  sales_order: number;
  warranty_months?: number;
  max_mileage?: number;
  coverage_note?: string;
  start_date: string;
  end_date: string;
}): Promise<WarrantyRecord> {
  const res = await api.post("/warranties/", data);
  return res.data;
}