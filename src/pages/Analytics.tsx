import React from 'react';
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useBookings } from '@/api/dataHooks';
import { useClientId } from '@/api/useClientId';
import { format, addDays, differenceInDays } from 'date-fns';

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}> = ({ title, value, icon, description }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
    </div>
  </div>
);

const Analytics: React.FC = () => {
  const { data: clientId, error: clientError, isLoading: isLoadingClient } = useClientId();
  const { currentProperty } = useApp();
  const { data: bookings = [] } = useBookings(currentProperty?.id || '');

  // Calculate analytics
  const analytics = React.useMemo(() => {
    if (!bookings.length) {
      return {
        nextGaps: [],
        biggestGap: 0,
        totalOpenNights: 30,
        upcomingCheckins: [],
        activeBookings: 0
      };
    }

    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);
    const sevenDaysFromNow = addDays(now, 7);

    // Sort bookings by start date
    const sortedBookings = [...bookings]
      .filter(booking => new Date(booking.end_date) >= now)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    // Find gaps
    const gaps: { start: Date; end: Date; days: number }[] = [];
    let lastEndDate = now;

    sortedBookings.forEach(booking => {
      const startDate = new Date(booking.start_date);
      if (startDate > lastEndDate && startDate <= thirtyDaysFromNow) {
        const gapDays = differenceInDays(startDate, lastEndDate);
        if (gapDays > 0) {
          gaps.push({
            start: lastEndDate,
            end: startDate,
            days: gapDays
          });
        }
      }
      lastEndDate = new Date(Math.max(lastEndDate.getTime(), new Date(booking.end_date).getTime()));
    });

    // Add final gap if needed
    if (lastEndDate < thirtyDaysFromNow) {
      gaps.push({
        start: lastEndDate,
        end: thirtyDaysFromNow,
        days: differenceInDays(thirtyDaysFromNow, lastEndDate)
      });
    }

    // Get next 3 gaps
    const nextGaps = gaps.slice(0, 3);

    // Find biggest gap
    const biggestGap = gaps.reduce((max, gap) => Math.max(max, gap.days), 0);

    // Calculate total open nights
    const totalOpenNights = gaps.reduce((total, gap) => total + gap.days, 0);

    // Upcoming check-ins
    const upcomingCheckins = sortedBookings
      .filter(booking => {
        const startDate = new Date(booking.start_date);
        return startDate >= now && startDate <= sevenDaysFromNow;
      })
      .slice(0, 5);

    // Active bookings
    const activeBookings = bookings.filter(booking => {
      const startDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);
      return startDate <= thirtyDaysFromNow && endDate >= now;
    }).length;

    return {
      nextGaps,
      biggestGap,
      totalOpenNights,
      upcomingCheckins,
      activeBookings
    };
  }, [bookings]);

  // Show loading state while checking client
  if (isLoadingClient) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Checking account...</p>
        </div>
      </div>
    );
  }

  // Show error state if client lookup fails
  if (clientError) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Account Setup Required</h3>
          <p className="text-gray-500">{clientError.message}</p>
        </div>
      </div>
    );
  }

  if (!currentProperty) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Property</h3>
          <p className="text-gray-500">
            Choose a property from the dropdown above to view analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Insights for {currentProperty.name}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Open Nights (30d)"
          value={analytics.totalOpenNights}
          icon={<Calendar className="w-5 h-5 text-blue-600" />}
        />
        <MetricCard
          title="Biggest Gap This Month"
          value={`${analytics.biggestGap} days`}
          icon={<Clock className="w-5 h-5 text-blue-600" />}
        />
        <MetricCard
          title="Upcoming Check-ins (7d)"
          value={analytics.upcomingCheckins.length}
          icon={<Users className="w-5 h-5 text-blue-600" />}
        />
        <MetricCard
          title="Active Bookings"
          value={analytics.activeBookings}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Empty Date Gaps */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Next 3 Empty Date Gaps</h3>
          {analytics.nextGaps.length > 0 ? (
            <div className="space-y-3">
              {analytics.nextGaps.map((gap, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(gap.start, 'MMM d')} - {format(gap.end, 'MMM d')}
                    </p>
                    <p className="text-sm text-gray-500">{gap.days} days available</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Available
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No gaps found in the next 30 days</p>
          )}
        </div>

        {/* Upcoming Check-ins */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Check-ins (7 days)</h3>
          {analytics.upcomingCheckins.length > 0 ? (
            <div className="space-y-3">
              {analytics.upcomingCheckins.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(booking.start_date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{booking.source}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Check-in
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No check-ins in the next 7 days</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;