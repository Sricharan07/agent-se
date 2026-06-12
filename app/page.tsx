import { DashboardExperience } from "@/components/dashboard/dashboard-experience";
import { QueryProvider } from "@/components/providers/query-provider";

export default function Home() {
  return (
    <QueryProvider>
      <DashboardExperience />
    </QueryProvider>
  );
}
