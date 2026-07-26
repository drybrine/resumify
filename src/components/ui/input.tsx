import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-10 px-3 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 text-sm",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export function Label({
  children,
  className,
  htmlFor,
}: {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-xs font-medium text-slate-400 mb-1.5", className)}
    >
      {children}
    </label>
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full min-h-[88px] px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 text-sm resize-y",
        className
      )}
      {...props}
    />
  );
}
