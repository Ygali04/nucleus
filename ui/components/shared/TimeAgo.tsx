'use client';

import { useEffect, useMemo, useState } from 'react';

function formatTimeAgo(dateString: string) {
  const delta = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(delta / 60_000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface TimeAgoProps {
  value: string;
}

export function TimeAgo({ value }: TimeAgoProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setTick((current) => current + 1),
      60_000,
    );
    return () => clearInterval(interval);
  }, []);

  const label = useMemo(() => formatTimeAgo(value), [tick, value]);
  return <span title={value}>{label}</span>;
}
