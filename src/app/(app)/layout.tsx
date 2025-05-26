import { SidebarProvider } from "@/components/ui/sidebar";
import MainContent from "../MainContent";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <MainContent>{children}</MainContent>
    </SidebarProvider>
  );
}