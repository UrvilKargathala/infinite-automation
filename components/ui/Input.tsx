import { forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
>(function Input({ label, className = "", ...props }, ref) {
  return (
    <div>
      {label && (
        <label className="block text-sm text-text-primary mb-1">{label}</label>
      )}
      <input
        ref={ref}
        className={`w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors ${className}`}
        {...props}
      />
    </div>
  );
});
