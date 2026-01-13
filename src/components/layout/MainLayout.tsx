import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { PageTourButton } from '@/components/onboarding/PageTourButton';
import { getTourIdForRoute } from '@/contexts/TourContext';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const tourId = getTourIdForRoute(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Top bar with notifications */}
      <div className="fixed top-0 right-0 left-[240px] z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center justify-end gap-2 px-6">
          {tourId && <PageTourButton tourId={tourId} />}
          <NotificationDropdown />
        </div>
      </div>
      <main className="pl-[240px] pt-16 transition-all duration-200">
        <div className="min-h-[calc(100vh-4rem)] p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
