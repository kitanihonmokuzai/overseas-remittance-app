"use client";

import { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className,
  icon,
  notice,
  pendingLabel
}: {
  children: ReactNode;
  className: string;
  icon?: ReactNode;
  notice?: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <button aria-busy={pending} className={`${className} ${pending ? "is-pending" : ""}`} disabled={pending} type="submit">
        {pending ? <span className="spinner" aria-hidden="true" /> : icon}
        <span>{pending ? pendingLabel : children}</span>
      </button>
      {pending ? (
        <span className="form-feedback" role="status">
          <span className="pulse-dot" aria-hidden="true" />
          {notice ?? pendingLabel}
        </span>
      ) : null}
    </>
  );
}
