
import { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);
  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <Navbar />
        <div className="flex">
          {/* Sidebar for desktop */}
          <div className="hidden md:block">
            <Sidebar />
          </div>
          {/* Sidebar in Drawer for mobile */}
          <DrawerContent className="md:hidden p-0 max-w-full w-64">
            <Sidebar closeDrawer={closeDrawer} />
          </DrawerContent>
          <main className="flex-1 flex flex-col items-center sm:block sm:items-start p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </Drawer>
  );
}
