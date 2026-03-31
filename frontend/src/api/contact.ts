import api from "./client";

export interface SellRequestPayload {
  name: string;
  phone:           string;
  email?:          string;
  brand?:          string;
  model?:          string;
  year?:           string;
  mileage?:        string;
  expected_price?: string;
  note?:           string;
}

export interface ContactRequestPayload {
  name:     string;
  phone?:   string;
  email?:   string;
  message?: string;
}

export async function submitSellRequest(
  data: SellRequestPayload
): Promise<{ message: string }> {
  const res = await api.post("/sell-request/", data);
  return res.data;
}

export async function submitContactRequest(
  data: ContactRequestPayload
): Promise<{ message: string }> {
  const res = await api.post("/contact-request/", data);
  return res.data;
}