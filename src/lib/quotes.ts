import type { RelationshipType } from '../types';

export const COUPLE_QUOTES = [
  "If you were a library book, I'd never return you. 📚",
  "Studying with you is my favourite subject.",
  "You're the reason I look forward to every Monday.",
  "My heart beats in the same rhythm as your laugh.",
  "You're my favourite notification. 🔔",
  "I don't need stars tonight — you outshine them all. ✨",
  "Being with you feels like home, even in a crowded corridor.",
  "You're my study break I never want to end. ☕",
  "You make ordinary days feel like the best days. 💛",
  "I'd travel anywhere, as long as it's with you. 🗺️",
  "You are the plot twist I never saw coming.",
  "My phone battery dies, but my love for you doesn't. 🔋",
  "You're the extra chapter I always want to read."
];

export const BESTFRIEND_QUOTES = [
  "Life's better with you in it, no cap. 🤝",
  "You're not just a friend, you're a vibe. ✨",
  "Thanks for always having my back. 💪",
  "Every hangout with you is a core memory. 🧠",
  "You make boring days legendary. 🔥",
  "Bro, you're literally the GOAT friend. 🐐",
  "I'd pick you first in every team, always. 🏆",
  "Our friendship is the real W. 🏅",
  "You're the friend everyone wishes they had. 💯",
  "No filter needed when I'm with you. 📸"
];

export const SIBLING_QUOTES = [
  "Annoying you is my favourite hobby, but I love you. 😂",
  "Nobody messes with you while I'm around. 💪",
  "We share DNA and the best memories. 🧬",
  "You're my built-in best friend for life. 🏠",
  "Fighting with you is just our love language. 😤💛",
  "I'd never trade you… maybe for snacks though. 🍕",
  "We're basically a two-person comedy show. 🎭",
  "Same parents, same chaos, same love. 🫂",
  "You make family the best thing I've got. 💛",
  "Partners in crime since day one. 🤫"
];

export const COUPLE_TIPS = [
  "Eat together at least 3 times a week — it builds real connection. 🍛",
  "Write one thing you're grateful about each other this week. 📝",
  "A ₹10 tea and a 20-min walk is often the best date. ☕",
  "Take one photo together every week — your future selves will thank you. 📸",
  "Split expenses fairly — it avoids resentment before it starts. 💸",
  "Celebrate small wins — a passed test, a good day, anything! 🎉",
  "Turn off phones for 30 minutes and just talk. It feels different. 🌙",
  "Keep a shared dream trip list. It keeps excitement alive. ✈️"
];

export const BESTFRIEND_TIPS = [
  "Check in on each other even when things seem fine. 💬",
  "Plan one hangout a week — consistency keeps bonds strong. 📅",
  "Celebrate each other's wins like they're your own. 🎉",
  "Be honest, not harsh — real friends keep it real. 💯",
  "Share playlists, memes, and random thoughts — it matters. 🎵",
  "Show up when it counts, not just when it's fun. 🤝",
  "Travel together at least once — it levels up the friendship. ✈️",
  "A simple 'how are you?' text goes a long way. 📱"
];

export const SIBLING_TIPS = [
  "Spend 10 minutes catching up daily — siblings drift apart fast. 🏠",
  "Back each other up in front of others, always. 💪",
  "Share your wins and losses — that's what family is for. 🫂",
  "Cook or order food together — bonding over meals is timeless. 🍕",
  "Remember birthdays and small things — it shows you care. 🎂",
  "Apologise first sometimes — pride kills closeness. 💛",
  "Create inside jokes — they're the glue of sibling love. 😂",
  "Plan a sibling trip — just the two of you. ✈️"
];

export function getQuotesForType(type: RelationshipType): string[] {
  if (type === 'bestfriends') return BESTFRIEND_QUOTES;
  if (type === 'siblings') return SIBLING_QUOTES;
  return COUPLE_QUOTES;
}

export function getTipsForType(type: RelationshipType): string[] {
  if (type === 'bestfriends') return BESTFRIEND_TIPS;
  if (type === 'siblings') return SIBLING_TIPS;
  return COUPLE_TIPS;
}

export function getRelationEmoji(type: RelationshipType): string {
  if (type === 'bestfriends') return '🤝';
  if (type === 'siblings') return '🫂';
  return '💛';
}

export function getRelationLabel(type: RelationshipType): string {
  if (type === 'bestfriends') return 'Best Friends';
  if (type === 'siblings') return 'Siblings';
  return 'Couple';
}

export function getDaysCountedTitle(type: RelationshipType): string {
  if (type === 'bestfriends') return 'Days as Besties';
  if (type === 'siblings') return 'Days Counted';
  return 'Days Together';
}

export const EXPENSE_CATEGORIES = {
  food: { label: 'Food', icon: '🍜' },
  chai: { label: 'Chai', icon: '☕' },
  transport: { label: 'Travel', icon: '🚌' },
  auto: { label: 'Auto', icon: '🛺' },
  groceries: { label: 'Groceries', icon: '🛒' },
  fun: { label: 'Fun', icon: '🎬' },
  books: { label: 'Study', icon: '📚' },
  trip: { label: 'Trip', icon: '✈️' },
  other: { label: 'Other', icon: '📦' },
} as const;
