import { MenuItem } from "@/data/menu";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export type PaymentMethod = "momo" | "cod";

export interface OrderFormInputs {
  customerName: string;
  phone: string;
  address: string;
  note?: string;
  paymentMethod: PaymentMethod;
  honeypot?: string; // Hidden input chống spam bot
}

export interface OrderItemPayload {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface OrderApiResponse {
  success: boolean;
  code?: string;
  total?: number;
  shippingFee?: number;
  subtotal?: number;
  paymentMethod?: PaymentMethod;
  error?: string;
}

export type OrderStatus = "new" | "preparing" | "delivering" | "completed" | "cancelled";

export interface OrderRecord {
  id?: string;
  code: string;
  customer_name: string;
  phone: string;
  address: string;
  note?: string | null;
  items: OrderItemPayload[];
  total: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  created_at?: string;
}

