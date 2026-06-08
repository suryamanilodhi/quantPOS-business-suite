"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Field, SelectField, TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { apiMessage } from "@/lib/client-api";

export function SettingsPage() {
  const [shop, setShop] = useState<any | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetch("/api/settings")
      .then(async (res) => {
        if (!res.ok) throw new Error(await apiMessage(res, "Unable to load settings"));
        return res.json();
      })
      .then(setShop)
      .catch((error) => toast.error(error.message));
  }, [toast]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { ...Object.fromEntries(form.entries()), taxEnabled: form.get("taxEnabled") === "on" };
    const response = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (response.ok) {
      setShop(await response.json());
      toast.success("Settings saved");
    } else {
      toast.error(await apiMessage(response, "Unable to save settings"));
    }
  }

  if (!shop) return <PageHeader title="Settings" description="Loading shop settings..." />;

  return (
    <>
      <PageHeader title="Settings" description="Shop profile, invoice defaults, GST, currency, and tax settings." />
      <Card className="p-6">
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" name="name" defaultValue={shop.name} required />
          <Field label="Phone" name="phone" defaultValue={shop.phone ?? ""} />
          <Field label="GST number" name="gstNumber" defaultValue={shop.gstNumber ?? ""} />
          <SelectField label="Currency" name="currency" defaultValue={shop.currency}><option value="INR">INR</option></SelectField>
          <Field label="Invoice prefix" name="invoicePrefix" defaultValue={shop.invoiceSetting?.invoicePrefix ?? "QP"} required />
          <Field label="Default tax %" name="defaultTax" type="number" defaultValue={shop.invoiceSetting?.defaultTax ?? 0} />
          <label className="mt-7 flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="taxEnabled" defaultChecked={shop.invoiceSetting?.taxEnabled ?? true} /> Tax enabled</label>
          <div className="sm:col-span-2"><TextAreaField label="Address" name="address" defaultValue={shop.address ?? ""} /></div>
          <div className="sm:col-span-2 flex justify-end"><Button>Save settings</Button></div>
        </form>
      </Card>
    </>
  );
}
