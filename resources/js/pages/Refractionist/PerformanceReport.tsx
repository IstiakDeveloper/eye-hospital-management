import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
  Activity,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Calendar,
  Eye,
  Target,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';

interface PerformanceReportProps {
  period: {
    from: string;
    to: string;
    days: number;
    date_from: string;
    date_to: string;
  };
  overallStats: {
    total_tests_completed: number;
    total_revenue: number;
    unique_patients: number;
    average_test_duration: number;
    peak_hour: string;
    busiest_day: string;
  };
  dailyStats: Array<{
    date: string;
    day_name: string;
    tests_count: number;
    total_revenue: number;
    avg_revenue: number;
  }>;
  hourlyBreakdown: Array<{
    hour: string;
    tests: number;
  }>;
  doctorPerformance: Array<{
    doctor_id: number;
    doctor_name: string;
    tests_completed: number;
    total_revenue: number;
    avg_duration: number;
    avg_revenue_per_test: number;
  }>;
  topDays: Array<{
    date: string;
    day_name: string;
    tests_count: number;
    total_revenue: number;
  }>;
  weeklyTrends: Array<{
    week_start: string;
    week_end: string;
    tests_count: number;
    revenue: number;
  }>;
  demographics: {
    gender: Record<string, number>;
    age_groups: Record<string, number>;
  };
}

const StatCard = ({ icon: Icon, title, value, subtitle, trend, color = 'blue' }: {
  icon: any;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  color?: string;
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <Icon className="h-8 w-8 mb-3" />
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {trend && (
          <div className="text-right">
            <span className="text-sm font-medium">{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ChartCard = ({ title, children, className = '' }: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

export default function PerformanceReport({
  period,
  overallStats,
  dailyStats,
  hourlyBreakdown,
  doctorPerformance,
  topDays,
  weeklyTrends,
  demographics
}: PerformanceReportProps) {
  const [dateFrom, setDateFrom] = useState(period.date_from);
  const [dateTo, setDateTo] = useState(period.date_to);

  const handleDateFilter = () => {
    router.get(route('refractionist.performance.report'), {
      date_from: dateFrom,
      date_to: dateTo
    });
  };

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

  const maxHourlyTests = Math.max(...hourlyBreakdown.map(h => h.tests));

  return (
    <AdminLayout>
      <Head title="Performance Report - Refractionist" />

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Performance Report</h1>
              <p className="text-gray-600 mt-1">
                {period.from} - {period.to} ({period.days} days)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleDateFilter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
              </div>

              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            icon={Eye}
            title="Total Tests"
            value={overallStats.total_tests_completed}
            color="blue"
          />
          <StatCard
            icon={DollarSign}
            title="Total Revenue"
            value={formatCurrency(overallStats.total_revenue)}
            color="green"
          />
          <StatCard
            icon={Users}
            title="Unique Patients"
            value={overallStats.unique_patients}
            color="purple"
          />
          <StatCard
            icon={Clock}
            title="Avg Duration"
            value={`${overallStats.average_test_duration} min`}
            color="orange"
          />
          <StatCard
            icon={TrendingUp}
            title="Peak Hour"
            value={overallStats.peak_hour}
            color="indigo"
          />
          <StatCard
            icon={Calendar}
            title="Busiest Day"
            value={overallStats.busiest_day}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Distribution */}
          <ChartCard title="Hourly Test Distribution">
            <div className="space-y-3">
              {hourlyBreakdown.map((hour) => (
                <div key={hour.hour} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-12">
                    {hour.hour}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(hour.tests / maxHourlyTests) * 100}%` }}
                    >
                      {hour.tests > 0 && (
                        <span className="text-xs font-medium text-white">
                          {hour.tests}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Top Performing Days */}
          <ChartCard title="Top Performing Days">
            <div className="space-y-3">
              {Array.isArray(topDays) && topDays.length > 0 ? (
                topDays.map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{day.date}</p>
                        <p className="text-sm text-gray-600">{day.day_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{day.tests_count} tests</p>
                      <p className="text-sm text-gray-600">{formatCurrency(day.total_revenue)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No data available for this period</p>
                </div>
              )}
            </div>
          </ChartCard>
        </div>

        {/* Doctor Performance */}
        <ChartCard title="Doctor Performance Analysis">
          <div className="overflow-x-auto">
            {Array.isArray(doctorPerformance) && doctorPerformance.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tests Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Revenue/Test
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {doctorPerformance.map((doctor) => (
                    <tr key={doctor.doctor_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{doctor.doctor_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="font-semibold text-blue-600">{doctor.tests_completed}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(doctor.total_revenue)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900">{doctor.avg_duration} min</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900">
                          {formatCurrency(doctor.avg_revenue_per_test)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No doctor performance data available</p>
              </div>
            )}
          </div>
        </ChartCard>

        {/* Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gender Distribution */}
          <ChartCard title="Patient Demographics - Gender">
            <div className="space-y-4">
              {Object.entries(demographics.gender).map(([gender, count]) => {
                const total = Object.values(demographics.gender).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                  <div key={gender} className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 capitalize">{gender}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-purple-600 h-3 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 w-16">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          {/* Age Distribution */}
          <ChartCard title="Patient Demographics - Age Groups">
            <div className="space-y-4">
              {Object.entries(demographics.age_groups).map(([ageGroup, count]) => {
                const total = Object.values(demographics.age_groups).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                  <div key={ageGroup} className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{ageGroup}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-indigo-600 h-3 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 w-16">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>

        {/* Weekly Trends */}
        <ChartCard title="Weekly Performance Trends">
          <div className="overflow-x-auto">
            {Array.isArray(weeklyTrends) && weeklyTrends.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Week Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tests Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Growth
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {weeklyTrends.map((week, index) => {
                    const prevWeek = weeklyTrends[index - 1];
                    const growth = prevWeek ?
                      Math.round(((week.tests_count - prevWeek.tests_count) / prevWeek.tests_count) * 100) : 0;

                    return (
                      <tr key={`${week.week_start}-${week.week_end}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {week.week_start} - {week.week_end}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-blue-600">{week.tests_count}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-green-600">
                            {formatCurrency(week.revenue)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {index > 0 && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              growth >= 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {growth >= 0 ? '+' : ''}{growth}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No weekly trends data available</p>
              </div>
            )}
          </div>
        </ChartCard>
      </div>
    </AdminLayout>
  );
}
