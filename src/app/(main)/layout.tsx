import { BottomTabBar } from "@/components/bottom-tab-bar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto min-h-dvh max-w-md pb-20 md:max-w-3xl">
      {children}
      <BottomTabBar />
    </div>
  );
}
