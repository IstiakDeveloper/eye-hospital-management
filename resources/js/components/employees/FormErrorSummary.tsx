import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface FormErrorSummaryProps {
    errors: Record<string, string | undefined>;
    title?: string;
}

export function FormErrorSummary({ errors, title = 'Please fix the following issues' }: FormErrorSummaryProps) {
    const entries = Object.entries(errors).filter(([, message]) => Boolean(message));

    if (entries.length === 0) {
        return null;
    }

    return (
        <Alert
            variant="destructive"
            className="border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100"
        >
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-red-800 dark:text-red-200">
                    {entries.map(([field, message]) => (
                        <li key={field}>{message}</li>
                    ))}
                </ul>
            </AlertDescription>
        </Alert>
    );
}

export function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="mt-1 text-xs text-red-600 dark:text-red-400">{message}</p>;
}
