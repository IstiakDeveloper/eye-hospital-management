import { router } from '@inertiajs/react';
import { Clock, MapPin, Navigation, Square } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ActiveMovementBannerProps {
    movement: {
        id: number;
        date: string;
        start_time: string;
        start_time_formatted?: string;
        start_timestamp_ms?: number;
        purpose: string;
        location?: string;
    };
}

export function ActiveMovementBanner({ movement }: ActiveMovementBannerProps) {
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

    useEffect(() => {
        const calculateElapsed = () => {
            try {
                if (movement.start_timestamp_ms) {
                    const diffMs = Math.max(0, Date.now() - movement.start_timestamp_ms);
                    setElapsedSeconds(Math.floor(diffMs / 1000));
                    return;
                }

                // Fallback local date parser
                const dateStr = String(movement.date).substring(0, 10);
                const timeStr = String(movement.start_time).substring(0, 8);
                const [year, month, day] = dateStr.split('-').map(Number);
                const timeParts = timeStr.split(':').map(Number);

                const start = new Date(year, month - 1, day, timeParts[0] || 0, timeParts[1] || 0, timeParts[2] || 0);
                const diffMs = Math.max(0, Date.now() - start.getTime());
                setElapsedSeconds(Math.floor(diffMs / 1000));
            } catch (err) {
                setElapsedSeconds(0);
            }
        };

        calculateElapsed();
        const interval = setInterval(calculateElapsed, 1000);
        return () => clearInterval(interval);
    }, [movement]);

    const formatTimer = (totalSecs: number) => {
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;

        const pad = (n: number) => n.toString().padStart(2, '0');
        if (hrs > 0) {
            return `${pad(hrs)}h ${pad(mins)}m ${pad(secs)}s`;
        }
        return `${pad(mins)}m ${pad(secs)}s`;
    };

    const displayStartTime = movement.start_time_formatted || movement.start_time;

    return (
        <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 p-4 sm:p-5 text-white shadow-xl border border-amber-500/30 relative">
            {/* Background Ambient Glow */}
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                    {/* Live Pulse Indicator */}
                    <div className="relative flex h-3.5 w-3.5 mt-1 sm:mt-0 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                                Movement In Progress
                            </span>
                            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-200 bg-black/40 px-3 py-1 rounded-lg border border-amber-500/20 shadow-inner">
                                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                                <span>Elapsed: {formatTimer(elapsedSeconds)}</span>
                            </div>
                        </div>

                        <p className="text-sm font-semibold text-slate-100 flex flex-wrap items-center gap-2 pt-0.5">
                            <span className="text-amber-200 flex items-center gap-1">
                                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                                {movement.purpose}
                            </span>
                            {movement.location && (
                                <>
                                    <span className="text-slate-500">•</span>
                                    <span className="text-slate-300 flex items-center gap-1 text-xs">
                                        <MapPin className="w-3 h-3 text-slate-400" />
                                        {movement.location}
                                    </span>
                                </>
                            )}
                            <span className="text-slate-500">•</span>
                            <span className="text-xs text-amber-300/80 font-mono">
                                Started at {displayStartTime}
                            </span>
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => router.patch(route('employee.movements.close', movement.id))}
                    className="inline-flex items-center justify-center px-4.5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-600/30 border border-amber-400/30 w-full sm:w-auto shrink-0 cursor-pointer group active:scale-[0.98]"
                >
                    <Square className="w-3.5 h-3.5 mr-2 fill-white text-white group-hover:scale-110 transition-transform" />
                    End Movement Now
                </button>
            </div>
        </div>
    );
}
