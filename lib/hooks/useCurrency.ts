import { useAuthStore } from "@/lib/store/useAuthStore";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/utils/currency";

/** The signed-in user's working currency (Settings → Currency). */
export function useCurrency(): CurrencyCode {
  return useAuthStore((s) => s.user?.currency ?? DEFAULT_CURRENCY);
}
