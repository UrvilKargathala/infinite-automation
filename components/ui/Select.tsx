import { forwardRef } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }
>(function Select({ label, className = "", children, ...props }, ref) {
  return (
    <div>
      {label && (
        <label className="block text-sm text-text-primary mb-1">{label}</label>
      )}
      <select
        ref={ref}
        className={`w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});
