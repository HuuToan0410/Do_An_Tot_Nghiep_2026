// src/api/dashboard.ts//import axios from "axios";
/*/
import api from "./client";

// ── Types ──────────────────────────────────────────────────────

export interface DashboardStats {
  total_vehicles:    number;
  total_deposits:    number;
  total_inspections: number;
  pending_deposits:  number;
  sold_cars:         number;
  brands: { brand: string; total: number }[];
}

export interface DashboardOverview {
  total_vehicles:    number;
  listed_vehicles:   number;
  sold_vehicles:     number;
  reserved_vehicles: number;
  refurbishing:      number;
  total_revenue:     string;
}

export interface RevenueRow {
  month?:   string;   // "2026-03"
  week?:    string;   // "2026-03-17"
  quarter?: string;   // "Q1/2026"
  period?:  string;
  total:    string;
  count:    number;
}

export interface RevenueData {
  revenue_by_month?:   RevenueRow[];
  revenue_by_week?:    RevenueRow[];
  revenue_by_quarter?: RevenueRow[];
}

export interface RecentDeposit {
  id:                    number;
  customer_name_display: string;
  phone:                 string;
  vehicle_name:          string;
  status:                string;
  amount:                string;
  created_at:            string;
}

export interface StaffCommission {
  staff_id:         number;
  staff_name:       string;
  total_orders:     number;
  total_revenue:    string;
  commission_rate:  string;
  commission_amount: string;
}

export interface CommissionData {
  period:           string;
  commission_rate:  string;
  total_orders:     number;
  total_revenue:    string;
  total_commission: string;
  staff:            StaffCommission[];
}

export type RevenuePeriod = "month" | "week" | "quarter";
export type CommissionPeriod = "month" | "week" | "quarter" | "all";

// ── Helpers ────────────────────────────────────────────────────

export function formatVNPrice(val?: string | number | null): string {
  const num = Number(val ?? 0);
  if (!num) return "0 đ";
  const ty    = Math.floor(num / 1_000_000_000);
  const trieu = Math.floor((num % 1_000_000_000) / 1_000_000);
  if (ty > 0 && trieu > 0) return `${ty} Tỷ ${trieu} Tr`;
  if (ty > 0)              return `${ty} Tỷ`;
  return `${trieu} Triệu`;
}

export function formatShortNum(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ── API calls ──────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get("/admin/stats/");
  return res.data;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const res = await api.get("/admin/overview/");
  return res.data;
}


export async function getRevenueByMonth(): Promise<RevenueData> {
  const res = await api.get("/admin/revenue/?period=month");
  return { revenue_by_month: res.data };
}

export async function getRevenueByWeek(): Promise<RevenueData> {
  const res = await api.get("/admin/revenue/?period=week");
  return { revenue_by_week: res.data };
}

export async function getRevenueByQuarter(): Promise<RevenueData> {
  const res = await api.get("/admin/revenue/?period=quarter");
  return { revenue_by_quarter: res.data };
}


export async function getRevenue(period: RevenuePeriod = "month"): Promise<RevenueRow[]> {
 
  const res = await api.get("/admin/revenue/", { params: { period } });
  
  // Backend trả về array trực tiếp
  const rows = Array.isArray(res.data) ? res.data : [];
  
  return rows.map((r: any) => ({
    month:   r.month,
    week:    r.week,
    quarter: r.quarter,
    total:   String(r.total ?? 0),
    count:   r.count ?? 0,
  }));
}

export async function getRecentDeposits(): Promise<RecentDeposit[]> {
  const res = await api.get("/admin/recent-deposits/");
  return res.data;
}


export async function getSalesCommissions(
  period: CommissionPeriod = "month",
  rate?: number,
): Promise<CommissionData> {
  const params: Record<string, string> = { period };
  if (rate !== undefined) params.rate = String(rate);
  const res = await api.get("/admin/commissions/", { params });
  return res.data;
}
*/
// src/api/dashboard.ts
import api from "./client";

// ── Types ──────────────────────────────────────────────────────

export interface DashboardStats {
  total_vehicles:    number;
  total_deposits:    number;
  total_inspections: number;
  pending_deposits:  number;
  sold_cars:         number;
  brands: { brand: string; total: number }[];
}

export interface DashboardOverview {
  total_vehicles:    number;
  listed_vehicles:   number;
  sold_vehicles:     number;
  reserved_vehicles: number;
  refurbishing:      number;
  total_revenue:     string;
}

export interface RevenueRow {
  month?:   string;
  week?:    string;
  quarter?: string;
  total:    string;
  count:    number;
}

export interface RecentDeposit {
  id:                    number;
  customer_name_display: string;
  phone:                 string;
  vehicle_name:          string;
  status:                string;
  amount:                string;
  created_at:            string;
}

export interface StaffCommission {
  staff_id:          number;
  staff_name:        string;
  total_orders:      number;
  total_revenue:     string;
  commission_rate:   string;
  commission_amount: string;
}

export interface CommissionData {
  period:           string;
  commission_rate:  string;
  total_orders:     number;
  total_revenue:    string;
  total_commission: string;
  staff:            StaffCommission[];
}

export type RevenuePeriod    = "month" | "week" | "quarter";
export type CommissionPeriod = "month" | "week" | "quarter" | "all";

// ── Helpers ────────────────────────────────────────────────────

export function formatVNPrice(val?: string | number | null): string {
  const num = Number(val ?? 0);
  if (!num) return "0 đ";
  const ty    = Math.floor(num / 1_000_000_000);
  const trieu = Math.floor((num % 1_000_000_000) / 1_000_000);
  if (ty > 0 && trieu > 0) return `${ty} Tỷ ${trieu} Tr`;
  if (ty > 0)              return `${ty} Tỷ`;
  return `${trieu} Triệu`;
}

// ── API calls ──────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get("/admin/stats/");
  return res.data;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const res = await api.get("/admin/overview/");
  return res.data;
}

export async function getRecentDeposits(): Promise<RecentDeposit[]> {
  const res = await api.get("/admin/recent-deposits/");
  return res.data;
}

/**
 * ✅ Gọi 1 endpoint duy nhất: /api/dashboard/revenue/?period=month|week|quarter
 * Backend RevenueView trong admin_dashboard_views.py xử lý tất cả
 */
export async function getRevenue(period: RevenuePeriod = "month"): Promise<RevenueRow[]> {
  const res = await api.get("/dashboard/revenue/", { params: { period } });

  // Backend trả về array trực tiếp
  const raw: any[] = Array.isArray(res.data) ? res.data : [];

  return raw.map((r) => {
    // Normalize month: "2026-03-01T00:00:00+00:00" → "2026-03"
    let month   = r.month   ? String(r.month).slice(0, 7) : undefined;
    let week    = r.week    ? String(r.week).slice(0, 10) : undefined;
    let quarter = r.quarter ? String(r.quarter)           : undefined;

    return {
      month,
      week,
      quarter,
      total: String(r.total ?? 0),
      count: Number(r.count ?? 0),
    };
  });
}

/** Hoa hồng nhân viên bán hàng */
export async function getSalesCommissions(
  period: CommissionPeriod = "month",
  rate?: number,
): Promise<CommissionData> {
  const params: Record<string, string> = { period };
  if (rate !== undefined) params.rate = String(rate);
  const res = await api.get("/admin/commissions/", { params });
  return res.data;
}