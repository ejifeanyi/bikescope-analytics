import React from "react";
import type { TenantSelectorProps } from "../types";

const TENANT_OPTIONS = [
  { value: "manhattan", label: "Manhattan BikeShare" },
  { value: "brooklyn", label: "Brooklyn Cycle Co" },
] as const;

export const TenantSelector: React.FC<TenantSelectorProps> = ({
  selectedTenant,
  onTenantChange,
}) => {
  return (
    <select
      value={selectedTenant}
      onChange={(e) => onTenantChange(e.target.value)}
      className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      aria-label="Select bike share tenant"
    >
      {TENANT_OPTIONS.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
};
