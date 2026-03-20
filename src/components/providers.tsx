"use client";
import { StoreProvider } from "@/lib/store";
import { ToastContainer } from "@/components/ui/toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      {children}
      <ToastContainer />
    </StoreProvider>
  );
}
