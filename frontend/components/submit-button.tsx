"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  idleLabel: string;
  pendingLabel?: string;
  className?: string;
  name?: string;
  value?: string;
}

export function SubmitButton({
  idleLabel,
  pendingLabel = "Working...",
  className,
  name,
  value,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={className}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
