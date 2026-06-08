import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold text-brand-600">QuantPOS</p>
        <h1 className="mt-2 text-3xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm text-muted">Enter your email and your team can connect this UI to an email provider.</p>
        <form className="mt-6 grid gap-4">
          <Field label="Email" type="email" placeholder="owner@shop.com" />
          <Button type="button">Send reset link</Button>
        </form>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand-600">Back to login</Link>
      </div>
    </div>
  );
}
