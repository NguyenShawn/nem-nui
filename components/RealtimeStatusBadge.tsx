"use client";

import React from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export type RealtimeConnectionStatus =
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "DISCONNECTED";

export type RealtimeConnectionState = RealtimeConnectionStatus;

interface RealtimeStatusBadgeProps {
  status: RealtimeConnectionStatus;
  onReconnect?: () => void;
  className?: string;
}

export function RealtimeStatusBadge({
  status,
  onReconnect,
  className = "",
}: RealtimeStatusBadgeProps) {
  let label = "Đang kết nối...";
  let dotColor = "bg-amber-400 animate-pulse rounded-full";
  let badgeStyle = "bg-amber-950/60 border-amber-800/40 text-amber-400";
  let icon = <RefreshCw className="w-3 h-3 animate-spin" />;

  switch (status) {
    case "CONNECTED":
      label = "Đã kết nối (Realtime)";
      dotColor = "bg-emerald-400 animate-pulse rounded-full";
      badgeStyle = "bg-emerald-950/60 border-emerald-800/40 text-emerald-400";
      icon = <Wifi className="w-3 h-3" />;
      break;
    case "RECONNECTING":
      label = "Đang kết nối lại...";
      dotColor = "bg-amber-400 animate-pulse rounded-full";
      badgeStyle = "bg-amber-950/60 border-amber-800/40 text-amber-400";
      icon = <RefreshCw className="w-3 h-3 animate-spin" />;
      break;
    case "DISCONNECTED":
      label = "Mất kết nối";
      dotColor = "bg-rose-500 rounded-full";
      badgeStyle = "bg-rose-950/60 border-rose-800/40 text-rose-400";
      icon = <WifiOff className="w-3 h-3" />;
      break;
    case "CONNECTING":
    default:
      label = "Đang kết nối...";
      dotColor = "bg-amber-400 animate-pulse rounded-full";
      badgeStyle = "bg-amber-950/60 border-amber-800/40 text-amber-400";
      icon = <RefreshCw className="w-3 h-3 animate-spin" />;
      break;
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all shadow-xs ${badgeStyle} ${className}`}
      title={`Trạng thái Realtime WebSocket: ${status} - ${label}`}
    >
      <span className={`w-2 h-2 ${dotColor}`} />
      <span className="hidden sm:inline font-mono uppercase text-[10px] tracking-wider font-extrabold opacity-75">
        [{status}]
      </span>
      <span>{label}</span>
      {status === "DISCONNECTED" && onReconnect && (
        <button
          onClick={onReconnect}
          type="button"
          className="ml-1 text-[10px] underline hover:text-white transition-colors cursor-pointer"
          title="Thử kết nối lại ngay"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}

export default RealtimeStatusBadge;
