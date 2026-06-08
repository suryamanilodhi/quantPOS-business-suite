import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function Field({ label, ...props }: FieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink">
      <span>{label}</span>
      <input className="h-10 rounded-md border border-line bg-white px-3 text-sm shadow-sm focus:border-brand-500" {...props} />
    </label>
  );
}

export function SelectField({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink">
      <span>{label}</span>
      <select className="h-10 rounded-md border border-line bg-white px-3 text-sm shadow-sm focus:border-brand-500" {...props}>
        {children}
      </select>
    </label>
  );
}

export function TextAreaField({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink">
      <span>{label}</span>
      <textarea className="min-h-24 rounded-md border border-line bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500" {...props} />
    </label>
  );
}
