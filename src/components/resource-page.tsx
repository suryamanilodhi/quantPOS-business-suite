"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Field, SelectField, TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { apiMessage } from "@/lib/client-api";

type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "date" | "select" | "textarea" | "checkbox" | "password";
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  hiddenOnEdit?: boolean;
  defaultValue?: (row: any) => string | number | boolean | null | undefined;
};

type ColumnConfig = {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
};

export function ResourcePage({
  title,
  description,
  endpoint,
  fields,
  columns,
  emptyText = "No records yet.",
  allowCreate = true,
  initiallyOpen = false,
  createLabel = "New"
}: {
  title: string;
  description: string;
  endpoint: string;
  fields: FieldConfig[];
  columns: ColumnConfig[];
  emptyText?: string;
  allowCreate?: boolean;
  initiallyOpen?: boolean;
  createLabel?: string;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(initiallyOpen);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(endpoint);
    if (response.ok) {
      setRows(await response.json());
    } else {
      setRows([]);
      toast.error(await apiMessage(response, "Unable to load records"));
    }
    setLoading(false);
  }, [endpoint, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(needle));
  }, [rows, query]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, FormDataEntryValue | boolean> = Object.fromEntries(form.entries());
    for (const field of fields) {
      if (field.type === "checkbox") payload[field.name] = form.get(field.name) === "on";
    }
    const response = await fetch(editing ? `${endpoint}/${editing.id}` : endpoint, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(data.error ?? "Unable to save");
      return;
    }
    toast.success("Saved successfully");
    setOpen(false);
    setEditing(null);
    await load();
  }

  async function remove(row: any) {
    if (!confirm(`Delete ${row.name ?? row.category ?? "record"}?`)) return;
    const response = await fetch(`${endpoint}/${row.id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error(await apiMessage(response, "Unable to delete"));
      return;
    }
    toast.success("Deleted successfully");
    await load();
  }

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        action={allowCreate ? <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} /> {createLabel}</Button> : null}
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm text-muted sm:w-80">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent" placeholder="Search or filter" />
          </div>
          <span className="text-sm text-muted">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                {columns.map((column) => <th key={column.key} className="px-4 py-3 font-semibold">{column.label}</th>)}
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-8 text-center text-muted" colSpan={columns.length + 1}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-4 py-8 text-center text-muted" colSpan={columns.length + 1}>{emptyText}</td></tr>
              ) : filtered.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  {columns.map((column) => <td key={column.key} className="px-4 py-3">{column.render ? column.render(row) : row[column.key]}</td>)}
                  <td className="px-4 py-3 text-right">
                    {allowCreate ? <Button variant="ghost" onClick={() => { setEditing(row); setOpen(true); }}>Edit</Button> : null}
                    {allowCreate ? <button className="ml-2 rounded-md p-2 text-danger hover:bg-red-50" onClick={() => remove(row)} aria-label="Delete"><Trash2 size={16} /></button> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form onSubmit={save} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-line bg-white p-6 shadow-soft">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? `Edit ${title}` : `New ${title}`}</h2>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.filter((field) => !(editing && field.hiddenOnEdit)).map((field) => {
                const defaultValue = field.defaultValue?.(editing) ?? editing?.[field.name] ?? "";
                if (field.type === "select") {
                  return (
                    <SelectField key={field.name} label={field.label} name={field.name} defaultValue={defaultValue} required={field.required}>
                      {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </SelectField>
                  );
                }
                if (field.type === "textarea") return <div key={field.name} className="sm:col-span-2"><TextAreaField label={field.label} name={field.name} defaultValue={defaultValue} required={field.required} /></div>;
                if (field.type === "checkbox") return <label key={field.name} className="mt-7 flex items-center gap-2 text-sm font-medium"><input type="checkbox" name={field.name} defaultChecked={Boolean(editing?.[field.name] ?? true)} /> {field.label}</label>;
                return <Field key={field.name} label={field.label} name={field.name} type={field.type ?? "text"} defaultValue={field.type === "date" && defaultValue ? String(defaultValue).slice(0, 10) : defaultValue} required={field.required} />;
              })}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button>Save</Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
