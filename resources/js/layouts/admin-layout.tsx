import React, { useState, ReactNode } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
  Eye,
  Users,
  Calendar,
  FileText,
  Pill,
  Home,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  ChevronDown,
  Settings
} from 'lucide-react';

interface PageProps {
  auth: {
    user: {
      name: string;
      email: string;
      role: {
        name: string;
      };
    };
  };
}

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title = 'Dashboard' }: AdminLayoutProps) {
  const { auth } = usePage<PageProps>().props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const logout = () => {
    router.post(route('logout'));
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 flex flex-col z-50 bg-gradient-to-b from-blue-800 to-indigo-900 text-white transition-all duration-300 ease-in-out transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:z-auto md:w-64 md:flex-shrink-0`}
      >
        <div className="flex items-center justify-between px-4 py-3 h-16 border-b border-blue-700">
          <Link href={route('dashboard')} className="flex items-center">
            <Eye className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-semibold">Eye Hospital</span>
          </Link>
          <button
            className="md:hidden rounded-md p-2 text-blue-200 hover:bg-blue-700 focus:outline-none"
            onClick={toggleSidebar}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pt-5 pb-4">
          <nav className="px-2 space-y-1">
            <Link
              href={route('dashboard')}
              className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                route().current('dashboard') ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'
              }`}
            >
              <Home className="h-5 w-5 mr-3" />
              Dashboard
            </Link>

            <Link
              href={route('patients.index')}
              className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                route().current('patients.*') ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'
              }`}
            >
              <Users className="h-5 w-5 mr-3" />
              Patients
            </Link>

            <Link
              href={route('appointments.today')}
              className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                route().current('appointments.*') ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'
              }`}
            >
              <Calendar className="h-5 w-5 mr-3" />
              Appointments
            </Link>

            {/* {(auth.user.role.name === 'Doctor' || auth.user.role.name === 'Super Admin') && (
              <Link
                href={route('prescriptions.index')}
                className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                  route().current('prescriptions.*') ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'
                }`}
              >
                <FileText className="h-5 w-5 mr-3" />
                Prescriptions
              </Link>
            )} */}

            {auth.user.role.name === 'Super Admin' && (
              <>
                <Link
                  href={route('medicines.index')}
                  className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                    route().current('medicines.*') ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  <Pill className="h-5 w-5 mr-3" />
                  Medicines
                </Link>

                <Link
                  href={route('doctors.index')}
                  className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                    route().current('doctors.*') ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  <User className="h-5 w-5 mr-3" />
                  Doctors
                </Link>

                <Link
                  href={route('users.index')}
                  className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                    route().current('users.*') ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  <Users className="h-5 w-5 mr-3" />
                  Users
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="border-t border-blue-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="bg-blue-200 rounded-full h-10 w-10 flex items-center justify-center text-blue-800 font-bold">
                {auth.user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{auth.user.name}</p>
              <p className="text-xs text-blue-200">{auth.user.role.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 text-gray-500 md:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 flex justify-between px-4">
            <div className="flex-1 flex items-center">
              <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
            </div>

            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notifications dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="p-2 rounded-full bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell className="h-6 w-6" />
                </button>

                {notificationsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                      </div>
                      <div className="px-4 py-3 text-sm text-gray-700">
                        <p>No new notifications</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center max-w-xs text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-blue-800 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {auth.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>

                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <Link
                        href={route('profile.edit')}
                        className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        <User className="mr-3 h-5 w-5 text-gray-500" />
                        Profile
                      </Link>
                      <Link
                        href="#"
                        className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        <Settings className="mr-3 h-5 w-5 text-gray-500" />
                        Settings
                      </Link>
                      <button
                        onClick={logout}
                        className="flex w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        <LogOut className="mr-3 h-5 w-5 text-gray-500" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}
