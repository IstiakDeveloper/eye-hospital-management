import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LogIn, Mail, Lock, User as UserIcon } from 'lucide-react';
import { FormEvent, useState } from 'react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState('');

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('login'));
    };

    // Auto-detect if input is email or username to change icon
    const isEmail = data.email.includes('@');

    return (
        <AuthLayout 
            title="Welcome back" 
            description="Enter your credentials to access your account."
        >
            <Head title="Login" />

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-1">
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                        Email or Username
                    </label>
                    <div className={`relative flex items-center rounded-xl border ${isFocused === 'email' ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200'} bg-white transition-all duration-200`}>
                        <div className="pl-4 pr-3 text-slate-400">
                            {data.email && !isEmail ? (
                                <UserIcon className={`h-5 w-5 ${isFocused === 'email' ? 'text-blue-500' : ''}`} />
                            ) : (
                                <Mail className={`h-5 w-5 ${isFocused === 'email' ? 'text-blue-500' : ''}`} />
                            )}
                        </div>
                        <input
                            id="email"
                            type="text"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            onFocus={() => setIsFocused('email')}
                            onBlur={() => setIsFocused('')}
                            required
                            className="block w-full appearance-none border-0 bg-transparent py-3.5 pl-0 pr-4 text-slate-900 placeholder-slate-400 focus:ring-0 sm:text-sm font-medium"
                            placeholder="name@example.com or username"
                        />
                    </div>
                    {errors.email && <p className="mt-2 text-sm font-medium text-red-500 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2 inline-block"></span>{errors.email}</p>}
                </div>

                <div className="space-y-1">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                        Password
                    </label>
                    <div className={`relative flex items-center rounded-xl border ${isFocused === 'password' ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200'} bg-white transition-all duration-200`}>
                        <div className="pl-4 pr-3 text-slate-400">
                            <Lock className={`h-5 w-5 ${isFocused === 'password' ? 'text-indigo-500' : ''}`} />
                        </div>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            onFocus={() => setIsFocused('password')}
                            onBlur={() => setIsFocused('')}
                            required
                            className="block w-full appearance-none border-0 bg-transparent py-3.5 pl-0 pr-12 text-slate-900 placeholder-slate-400 focus:ring-0 sm:text-sm font-medium tracking-wide"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600 transition-colors"
                            onClick={togglePasswordVisibility}
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-2 text-sm font-medium text-red-500 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2 inline-block"></span>{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center">
                        <div className="relative flex items-center">
                            <input
                                id="remember"
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 checked:border-blue-600 checked:bg-blue-600 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 transition-all"
                            />
                            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 17 12" fill="none">
                                <path d="M1 5.5L6 10.5L16 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <label htmlFor="remember" className="ml-3 block text-sm font-medium text-slate-600 cursor-pointer select-none">
                            Remember me
                        </label>
                    </div>

                    <div className="text-sm">
                        <Link href={route('password.request')} className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:hover:scale-100"
                    >
                        <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                        <LogIn className="mr-2 h-5 w-5 relative z-10" />
                        <span className="relative z-10">{processing ? 'Signing in...' : 'Sign in to portal'}</span>
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
}
