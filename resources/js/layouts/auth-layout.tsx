import { Link } from '@inertiajs/react';
import { Eye, Stethoscope, Activity, HeartPulse } from 'lucide-react';
import { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Left/Top side: Form */}
            <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:flex-none lg:px-20 xl:px-24 relative z-10 bg-white/70 backdrop-blur-xl">
                <div className="mx-auto w-full max-w-md">
                    <div className="flex items-center space-x-3 mb-10">
                        <img src="/logo.png" alt="Eye Hospital Logo" className="h-10 w-10 object-contain shrink-0" />
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800 tracking-tight">
                            Eye Hospital
                        </span>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">{title}</h2>
                        {description && <p className="text-base text-slate-500">{description}</p>}
                    </div>

                    <div className="mt-8">
                        {children}
                    </div>
                </div>

                <div className="absolute bottom-6 left-0 right-0 text-center lg:left-24 lg:right-auto lg:text-left">
                    <p className="text-xs text-slate-400 font-medium">
                        © {new Date().getFullYear()} Eye Hospital Management System.<br className="lg:hidden" /> All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right side: Decorative background */}
            <div className="relative hidden w-0 flex-1 lg:block overflow-hidden bg-slate-900">
                {/* Modern Abstract Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 z-0"></div>
                
                {/* Geometric decorative elements */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>
                <div className="absolute top-48 -left-24 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>
                <div className="absolute -bottom-24 left-48 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>
                
                <div className="absolute inset-0 flex items-center justify-center p-12 z-10">
                    <div className="max-w-lg text-white space-y-8 backdrop-blur-md bg-white/10 p-10 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400"></div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Advanced Vision Care
                            </h3>
                            <p className="text-lg text-indigo-100 leading-relaxed">
                                Streamline hospital operations, manage patient records seamlessly, and provide better eye care with our comprehensive management system.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                            <div className="flex items-center space-x-3 text-indigo-100">
                                <div className="bg-white/10 p-2 rounded-lg shadow-inner shadow-white/20">
                                    <Stethoscope className="w-5 h-5 text-blue-300" />
                                </div>
                                <span className="font-medium text-sm">Expert Doctors</span>
                            </div>
                            <div className="flex items-center space-x-3 text-indigo-100">
                                <div className="bg-white/10 p-2 rounded-lg shadow-inner shadow-white/20">
                                    <Eye className="w-5 h-5 text-indigo-300" />
                                </div>
                                <span className="font-medium text-sm">Vision Tests</span>
                            </div>
                            <div className="flex items-center space-x-3 text-indigo-100">
                                <div className="bg-white/10 p-2 rounded-lg shadow-inner shadow-white/20">
                                    <Activity className="w-5 h-5 text-cyan-300" />
                                </div>
                                <span className="font-medium text-sm">Analytics</span>
                            </div>
                            <div className="flex items-center space-x-3 text-indigo-100">
                                <div className="bg-white/10 p-2 rounded-lg shadow-inner shadow-white/20">
                                    <HeartPulse className="w-5 h-5 text-emerald-300" />
                                </div>
                                <span className="font-medium text-sm">Patient Care</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
