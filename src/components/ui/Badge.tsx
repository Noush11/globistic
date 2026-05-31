import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  brand: "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
  green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  yellow: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
};

export function Badge({
  children,
  tone = "default",
  className
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// Map order statuses to badge tones.
export const ORDER_STATUS_TONE: Record<string, keyof typeof tones> = {
  PENDING: "yellow",
  PAID: "blue",
  IN_PRODUCTION: "purple",
  PRINTED: "brand",
  SHIPPED: "blue",
  DELIVERED: "green",
  CANCELLED: "red"
};
