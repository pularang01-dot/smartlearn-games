import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const base =
  "w-full rounded-xl border bg-white px-3.5 text-sm text-ink placeholder:text-ink-mute transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-paper disabled:text-ink-mute";

export function fieldClass(hasError?: boolean, extra?: string) {
  return cn(base, hasError ? "border-wrong" : "border-line", extra);
}

export function Field({ label, hint, error, children, htmlFor, className }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-ink-mute">{hint}</p>}
      {error && <p role="alert" className="text-xs font-medium text-wrong">{error}</p>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; wrapperClassName?: string };
export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField({ label, hint, error, className, wrapperClassName, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fid} className={wrapperClassName}>
      <input ref={ref} id={fid} aria-invalid={!!error} aria-describedby={error ? `${fid}-err` : undefined} className={fieldClass(!!error, cn("h-11", className))} {...rest} />
    </Field>
  );
});

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string; wrapperClassName?: string };
export const TextArea = forwardRef<HTMLTextAreaElement, AreaProps>(function TextArea({ label, hint, error, className, wrapperClassName, id, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fid} className={wrapperClassName}>
      <textarea ref={ref} id={fid} aria-invalid={!!error} className={fieldClass(!!error, cn("min-h-[88px] py-2.5", className))} {...rest} />
    </Field>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; hint?: string; error?: string; wrapperClassName?: string };
export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField({ label, hint, error, className, wrapperClassName, id, children, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  const select = <select ref={ref} id={fid} aria-invalid={!!error} className={fieldClass(!!error, cn("h-11", className))} {...rest}>{children}</select>;
  if (!label) return select;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fid} className={wrapperClassName}>
      {select}
    </Field>
  );
});

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <label htmlFor={id} className="block text-sm font-semibold text-ink">{label}</label>
        {description && <p className="mt-0.5 text-xs text-ink-mute">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50", checked ? "bg-brand-600" : "bg-ink-mute/40")}
      >
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
    </div>
  );
}
