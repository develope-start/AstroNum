"use client";

import { usePathname } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FloatingContactHub from "@/components/FloatingContactHub";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCalculationRoom = pathname === "/chart/room";

  // The calculation room is a complete workspace, not a panel inside the public site.
  // Keeping the contact hub preserves support access without rendering the public footer.
  if (isCalculationRoom) {
    return (
      <>
        {children}
        <FloatingContactHub className="z-[240]" />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="relative mx-auto w-full max-w-full overflow-x-hidden px-4 pb-12 pt-3 sm:px-8 sm:pb-20 sm:pt-6 lg:px-12 xl:px-16">
        {children}
      </main>
      <Footer />
      <FloatingContactHub className="z-[240]" />
    </>
  );
}
