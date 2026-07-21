"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#0e0d0c",
            color: "#faf7f2",
            border: "none",
            fontWeight: 600,
          },
        }}
      />
    </SessionProvider>
  );
}
