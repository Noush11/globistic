import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function OrderConfirmationPage({ params }: { params: { orderNumber: string } }) {
  return (
    <div className="container-px py-24 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600 dark:bg-green-950">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h1 className="mt-6 text-3xl font-bold">Thank you for your order!</h1>
      <p className="mt-2 text-slate-500">
        Your order <span className="font-semibold text-brand-600">{params.orderNumber}</span> has been placed.
      </p>
      <p className="mt-1 text-sm text-slate-400">A confirmation email is on its way.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/account/orders"><Button>View my orders</Button></Link>
        <Link href="/products"><Button variant="outline">Keep shopping</Button></Link>
      </div>
    </div>
  );
}
