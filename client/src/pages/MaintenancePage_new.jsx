import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Wrench, Plus, CheckCircle2, AlertTriangle,
  X, Gauge, Package, Trash2, Activity,
  MessageCircle, ChevronDown, ChevronUp,
  Send, User, AlertCircle, CheckCheck,
} from "lucide-react";

const ToastContainer = ({ toasts, onDismiss }) => (
  React.createElement("div", {
    style: { position: "fixed", top: "24px", right: "24px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "10px", pointerEvents: "none" }
  }, toasts.map((toast) =>
    React.createElement("div", { key: toast.id, style: { pointerEvents: "all", display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 18px", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.14)", border: `1px solid ${toast.type === "success" ? "#A6F4C5" : toast.type === "error" ? "#FECDCA" : toast.type === "warning" ? "#FEDF89" : "#BEE3F8"}`, backgroundColor: toast.type === "success" ? "#F6FEF9" : toast.type === "error" ? "#FEF3F2" : toast.type === "warning" ? "#FFFAEB" : "#EFF8FF", minWidth: "320px", maxWidth: "420px", animation: "slideInRight 0.3s ease" } },
      React.createElement("div", { style: { width: "32px", height: "32px", borderRadius: "50%", backgroundColor: toast.type === "success" ? "#EBFDF2" : toast.type === "error" ? "#FEE4E2" : toast.type === "warning" ? "#FEF0C7" : "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: toast.type === "success" ? "#027A48" : toast.type === "error" ? "#D92D20" : toast.type === "warning" ? "#B54708" : "#175CD3" } },
        toast.type === "success" ? React.createElement(CheckCheck, { size: 16 }) : toast.type === "error" ? React.createElement(AlertCircle, { size: 16 }) : React.createElement(AlertTriangle, { size: 16 })
      ),
      React.createElement("div", { style: { flex: 1 } },
        React.createElement("div", { style: { fontWeight: "700", fontSize: "13px", color: "#101828", marginBottom: "2px" } }, toast.title),
        React.createElement("div", { style: { fontSize: "12px", color: "#475467", lineHeight: "1.5" } }, toast.message)
      ),
      React.createElement("button", { onClick: () => onDismiss(toast.id), style: { background: "transparent", border: "none", cursor: "pointer", color: "#98A2B3", padding: "2px", flexShrink: 0 } }, React.createElement(X, { size: 14 }))
    )
  ))
);
