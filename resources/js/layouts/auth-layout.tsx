import React, { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center">
            <Eye className="h-12 w-12 text-blue-700" />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-center text-sm text-gray-600">
            {description}
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-600">
        <p>© {new Date().getFullYear()} Eye Hospital Management System. All rights reserved.</p>
      </div>
    </div>
  );
}
