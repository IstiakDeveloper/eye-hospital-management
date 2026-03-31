import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

// Import highlight.js for error rendering
import hljs from 'highlight.js';
(window as any).hljs = hljs;

const appName = import.meta.env.VITE_APP_NAME || 'Eye Hospital';

// Force all JS Date locale formatting to Asia/Dhaka (prevents day-shifts across machines/timezones).
// This covers legacy usages like `new Date(x).toLocaleDateString(...)` across the codebase.
const DHAKA_TIMEZONE = 'Asia/Dhaka' as const;
const originalToLocaleDateString = Date.prototype.toLocaleDateString;
const originalToLocaleTimeString = Date.prototype.toLocaleTimeString;
const originalToLocaleString = Date.prototype.toLocaleString;

function withDhakaTimeZone(options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions | undefined {
    if (!options) {
        return { timeZone: DHAKA_TIMEZONE };
    }
    if (options.timeZone) {
        return options;
    }
    return { ...options, timeZone: DHAKA_TIMEZONE };
}

Date.prototype.toLocaleDateString = function (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions): string {
    return originalToLocaleDateString.call(this, locales, withDhakaTimeZone(options));
};

Date.prototype.toLocaleTimeString = function (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions): string {
    return originalToLocaleTimeString.call(this, locales, withDhakaTimeZone(options));
};

Date.prototype.toLocaleString = function (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions): string {
    return originalToLocaleString.call(this, locales, withDhakaTimeZone(options));
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
