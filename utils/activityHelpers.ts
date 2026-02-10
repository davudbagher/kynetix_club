// utils/activityHelpers.ts

// Format timestamp to "time ago" string
export const formatTimeAgo = (timestamp: Date | string): string => {
    const now = new Date();
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;

    return date.toLocaleDateString();
};

// Format step count (12000 -> "12k")
export const formatStepCount = (steps: number): string => {
    if (steps >= 1000) {
        return `${(steps / 1000).toFixed(1)}k`;
    }
    return steps.toString();
};

// Calculate distance from steps (rough estimate)
export const stepsToKm = (steps: number): number => {
    return steps * 0.0008; // Average: 0.8m per step
};

// Generate a random user avatar color based on name
export const getAvatarColor = (name: string): string => {
    const colors = [
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#FFE66D', // Yellow
        '#95E1D3', // Mint
        '#FF9F1C', // Orange
        '#C6FF00', // Lime
        '#A8E6CF', // Light green
        '#FFD3B6', // Peach
    ];

    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

// Get first letter for avatar
export const getAvatarLetter = (name: string): string => {
    return name.charAt(0).toUpperCase();
};
