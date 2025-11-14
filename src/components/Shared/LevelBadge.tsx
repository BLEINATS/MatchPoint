import React from 'react';

interface LevelBadgeProps {
  name: string;
  color: string;
}

const colorClasses: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  zinc: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-200',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
  lime: 'bg-lime-100 text-lime-800 dark:bg-lime-700 dark:text-lime-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-200',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-700 dark:text-teal-200',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-700 dark:text-cyan-200',
  sky: 'bg-sky-100 text-sky-800 dark:bg-sky-700 dark:text-sky-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-200',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-700 dark:text-violet-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-700 dark:text-fuchsia-200',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-700 dark:text-pink-200',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-700 dark:text-rose-200',
};

const LevelBadge: React.FC<LevelBadgeProps> = ({ name, color }) => {
  const className = colorClasses[color] || colorClasses.gray;
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${className}`}>
      {name}
    </span>
  );
};

export default LevelBadge;
