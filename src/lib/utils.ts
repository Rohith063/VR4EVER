import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return Math.round(amount).toLocaleString('en-IN');
}

export function generatePairCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export interface RelationshipDuration {
  days: number;
  totalDays: number;
  years: number;
  weeks: number;
  months: number;
  hours: string;
  sub: string;
  dateStr: string;
  summary: string;
}

export function calculateRelationshipTime(startDate: string | null | undefined): RelationshipDuration {
  if (!startDate) {
    return {
      days: 0,
      totalDays: 0,
      years: 0,
      weeks: 0,
      months: 0,
      hours: '0K',
      sub: 'Just getting started 🌱',
      dateStr: 'Since —',
      summary: '0 days',
    };
  }

  const [year, month, day] = startDate.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  start.setHours(0, 0, 0, 0);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffMs = now.getTime() - start.getTime();
  const totalDays = Math.max(0, Math.floor(diffMs / 86400000));

  let yearsDiff = now.getFullYear() - start.getFullYear();
  let monthsDiff = now.getMonth() - start.getMonth();
  let daysDiff = now.getDate() - start.getDate();

  if (daysDiff < 0) {
    monthsDiff--;
  }
  if (monthsDiff < 0) {
    yearsDiff--;
    monthsDiff += 12;
  }

  const totalMonths = yearsDiff * 12 + monthsDiff;
  const parts: string[] = [];

  if (yearsDiff > 0) parts.push(`${yearsDiff} ${yearsDiff === 1 ? 'year' : 'years'}`);
  if (monthsDiff > 0) parts.push(`${monthsDiff} ${monthsDiff === 1 ? 'month' : 'months'}`);
  if (parts.length < 2) {
    const daysRemainder = Math.max(0, daysDiff);
    parts.push(`${daysRemainder} ${daysRemainder === 1 ? 'day' : 'days'}`);
  }

  const yearlySubs = [
    '🎊 One whole year!',
    '✨ Two years!',
    '💛 Three years!',
    '🌟 Four years!',
    '🎉 Five years or more!',
  ];

  const monthlySubs = [
    'Just getting started 🌱',
    'One month strong 💛',
    'Two months 😊',
    'Three months ✨',
    'Four months! 💪',
    'Five months 🌟',
    'Half a year! 🎉',
    'Seven months 💫',
    'Eight months 🚀',
    'Nine months 🍂',
    'Ten months 🎊',
    'Eleven months 💘',
  ];

  const sub =
    yearsDiff >= 1
      ? yearlySubs[Math.min(yearsDiff - 1, yearlySubs.length - 1)]
      : monthlySubs[Math.min(totalMonths, monthlySubs.length - 1)];

  const dateStr =
    'Since ' +
    start.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return {
    days: totalDays,
    totalDays,
    years: yearsDiff,
    weeks: Math.floor(totalDays / 7),
    months: totalMonths,
    hours: Math.floor((totalDays * 24) / 1000) + 'K',
    sub,
    dateStr,
    summary: parts.join(' & ') || '0 days',
  };
}

// Haversine formula to compute distance between two coordinates in kilometers
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 decimal place (e.g. 4.2 km)
}
