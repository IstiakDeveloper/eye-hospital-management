import { Download, Share, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        // Check if app is already running in standalone mode (installed PWA)
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (navigator as any).standalone ||
            document.referrer.includes('android-app://');

        if (isStandalone) {
            return; // App is already installed and running as PWA
        }

        // Check if iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const iosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(iosDevice);

        // Handle Chrome / Android / Desktop PWA install event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            
            // Check if dismissed recently (e.g. within 1 day)
            const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at');
            if (!dismissedAt || Date.now() - Number(dismissedAt) > 86400000) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Show iOS prompt if on iOS and not dismissed recently
        if (iosDevice) {
            const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at');
            if (!dismissedAt || Date.now() - Number(dismissedAt) > 86400000) {
                setShowPrompt(true);
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSInstructions(true);
            return;
        }

        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted PWA installation');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setShowIOSInstructions(false);
        localStorage.setItem('pwa_prompt_dismissed_at', String(Date.now()));
    };

    if (!showPrompt) return null;

    return (
        <>
            {/* Main PWA Install Bottom Banner / Toast */}
            <div className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md mx-auto sm:mx-0 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-blue-500/30 backdrop-blur-md animate-bounce-short no-print">
                <div className="flex items-start gap-3.5">
                    <img
                        src="/logo.png"
                        alt="Eye Hospital Logo"
                        className="h-12 w-12 rounded-xl object-contain bg-white p-1 border border-white/20 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h3 className="font-extrabold text-sm text-white">Install Eye Hospital App</h3>
                            <button
                                onClick={handleDismiss}
                                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                                aria-label="Close prompt"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-snug">
                            Please install the official app first for a faster experience & instant updates.
                        </p>

                        <div className="flex items-center gap-2 mt-3">
                            <button
                                onClick={handleInstallClick}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Install App Now
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="text-xs text-slate-400 hover:text-white font-semibold py-2 px-3 rounded-xl transition-colors"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* iOS Instructions Modal */}
            {showIOSInstructions && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm no-print">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-slate-900 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                                <h3 className="font-extrabold text-base">Install on iPhone / iPad</h3>
                            </div>
                            <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">1</span>
                                Tap the <strong>Share</strong> button <Share className="w-4 h-4 text-blue-600 inline ml-1" /> in Safari toolbar.
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">2</span>
                                Scroll down and tap <strong>'Add to Home Screen'</strong>.
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">3</span>
                                Tap <strong>Add</strong> at top right to complete installation.
                            </p>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
