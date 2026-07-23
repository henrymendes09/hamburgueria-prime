"use client";

import { useFormStatus } from "react-dom";

export function SettingsSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      formNoValidate
      disabled={pending}
      className="rounded-xl bg-flame px-6 py-4 font-bold text-white transition-opacity disabled:cursor-wait disabled:opacity-60 md:col-span-2"
    >
      {pending ? "Salvando..." : "Salvar configurações"}
    </button>
  );
}
