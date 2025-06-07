import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, loading }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow flex flex-col items-center">
      <span className="text-sm text-gray-500 dark:text-gray-400 mb-2">{title}</span>
      {loading ? (
        <div className="w-20 h-8 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
      ) : (
        <span className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</span>
      )}
    </div>
  );
};

export default MetricCard;