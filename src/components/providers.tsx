"use client";
import { AuthProvider } from "@/lib/AuthProvider";
import { StoreProvider } from "@/lib/store";
import { ToastContainer } from "@/components/ui/toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>
        {children}
        <ToastContainer />
      </StoreProvider>
    </AuthProvider>
  );
}
