const DHAKA_TIMEZONE = 'Asia/Dhaka' as const;

type DateInput = string | number | Date | null | undefined;

function isDateOnlyString(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toDhakaDate(value: DateInput): Date | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }

    if (typeof value === 'number') {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    // IMPORTANT:
    // - ISO timestamps (e.g. 2026-03-01T01:49:06.000000Z) are fine to parse as Date.
    // - Date-only strings (YYYY-MM-DD) are parsed as UTC by JS and can shift a day in +06.
    //   For those, force a Dhaka-local midnight by adding an explicit +06:00 offset.
    const str = value.trim();
    const normalized = isDateOnlyString(str) ? `${str}T00:00:00+06:00` : str;

    const d = new Date(normalized);
    return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDhakaDate(
    value: DateInput,
    options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
): string {
    const d = toDhakaDate(value);
    if (!d) {
        return 'N/A';
    }

    return new Intl.DateTimeFormat('en-GB', {
        timeZone: DHAKA_TIMEZONE,
        ...options,
    }).format(d);
}

export function formatDhakaDateTime(value: DateInput): string {
    return formatDhakaDate(value, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Whole years between DOB and a reference date using Asia/Dhaka calendar dates
 * (avoids UTC midnight shifting YYYY-MM-DD birthdates).
 */
export function getAgeFromDateOfBirth(dob: DateInput, asOf: DateInput = new Date()): number | null {
    const birth = toDhakaDate(dob);
    const ref = toDhakaDate(asOf);
    if (!birth || !ref) {
        return null;
    }

    const ymd = (d: Date) => {
        const s = new Intl.DateTimeFormat('en-CA', {
            timeZone: DHAKA_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(d);
        const [y, m, day] = s.split('-').map(Number);
        return { y, m, day };
    };

    const b = ymd(birth);
    const t = ymd(ref);
    let age = t.y - b.y;
    if (t.m < b.m || (t.m === b.m && t.day < b.day)) {
        age -= 1;
    }
    return age >= 0 ? age : null;
}
