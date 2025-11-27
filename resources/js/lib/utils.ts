import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine multiple class names with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format date to a readable string
 */
export function formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Format time to a readable string
 */
export function formatTime(time: string) {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Format datetime to a readable string
 */
export function formatDateTime(dateTime: string | Date) {
    return new Date(dateTime).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 50) {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
}

/**
 * Generate a random ID
 */
export function generateId(length: number = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number) {
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
    }).format(amount);
    return `৳${formatted}`;
}
/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string | Date) {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    return age;
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string) {
    // For Bangladesh phone numbers
    if (phone.length === 11 && phone.startsWith('01')) {
        return `+88${phone}`;
    }
    return phone;
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date) {
    const today = new Date();
    const compareDate = new Date(date);
    return (
        compareDate.getDate() === today.getDate() &&
        compareDate.getMonth() === today.getMonth() &&
        compareDate.getFullYear() === today.getFullYear()
    );
}

/**
 * Get relative time (e.g., "2 hours ago", "yesterday")
 */
export function getRelativeTime(date: string | Date) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const now = new Date();
    const compareDate = new Date(date);
    const diffInSeconds = Math.floor((compareDate.getTime() - now.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > -7 && diffInDays < 7) {
        return rtf.format(diffInDays, 'day');
    } else if (diffInHours > -24 && diffInHours < 24) {
        return rtf.format(diffInHours, 'hour');
    } else if (diffInMinutes > -60 && diffInMinutes < 60) {
        return rtf.format(diffInMinutes, 'minute');
    } else {
        return formatDate(date);
    }
}

/**
 * Get status color class based on status string
 */
export function getStatusColorClass(status: string) {
    switch (status.toLowerCase()) {
        case 'completed':
            return 'bg-green-100 text-green-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        case 'active':
            return 'bg-blue-100 text-blue-800';
        case 'inactive':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}
