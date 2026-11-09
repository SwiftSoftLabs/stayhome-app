import { DashboardLayout } from "@/components/dashboard-layout";

export function PayoutsUnavailable({ title, body }: { title: string; body: string }) {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600">{body}</p>
      </div>
    </DashboardLayout>
  );
}
