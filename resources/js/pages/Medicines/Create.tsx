import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from '@/components/ui/card';
import { Save, X, Pill, ChevronDown } from 'lucide-react';

interface MedicineCreateProps {
    types: string[];
    manufacturers: string[];
}

export default function MedicineCreate({ types, manufacturers }: MedicineCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        generic_name: '',
        type: '',
        manufacturer: '',
        description: '',
        is_active: true,
    });

    const [isOpen, setIsOpen] = useState(false);
    const [isManufacturerOpen, setIsManufacturerOpen] = useState(false);
    const [filteredTypes, setFilteredTypes] = useState<string[]>([]);
    const [filteredManufacturers, setFilteredManufacturers] = useState<string[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const manufacturerDropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const manufacturerInputRef = useRef<HTMLInputElement>(null);

    const allTypes = types;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
            if (manufacturerDropdownRef.current && !manufacturerDropdownRef.current.contains(event.target as Node)) {
                setIsManufacturerOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (data.type) {
            const filtered = allTypes.filter(type =>
                type.toLowerCase().includes(data.type.toLowerCase())
            );
            setFilteredTypes(filtered);
        } else {
            setFilteredTypes(allTypes);
        }
    }, [data.type, allTypes]);

    useEffect(() => {
        if (data.manufacturer) {
            const filtered = manufacturers.filter(manufacturer =>
                manufacturer.toLowerCase().includes(data.manufacturer.toLowerCase())
            );
            setFilteredManufacturers(filtered);
        } else {
            setFilteredManufacturers(manufacturers);
        }
    }, [data.manufacturer, manufacturers]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setData('type', value);
        setIsOpen(true);
    };

    const handleTypeSelect = (selectedType: string) => {
        setData('type', selectedType);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const handleManufacturerSelect = (selectedManufacturer: string) => {
        setData('manufacturer', selectedManufacturer);
        setIsManufacturerOpen(false);
        manufacturerInputRef.current?.focus();
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleManufacturerFocus = () => {
        setIsManufacturerOpen(true);
    };

    const handleManufacturerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setData('manufacturer', value);
        setIsManufacturerOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('medicines.store'));
    };

    return (
        <AdminLayout title="Add New Medicine">
            <Head title="Add New Medicine" />

            <div className="max-w-5xl mx-auto p-6">
                <Card className="shadow-lg border-0 bg-white">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                        <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                            <div className="p-2 bg-blue-500 rounded-lg mr-3">
                                <Pill className="h-6 w-6 text-white" />
                            </div>
                            Add New Medicine
                        </CardTitle>
                        <CardDescription className="text-gray-600 mt-2">
                            Enter the medicine details below. Fields marked with * are required.
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="p-8">
                            {/* Basic Information Section */}
                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-gray-900 mb-6 pb-2 border-b border-gray-200">
                                    Basic Information
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Medicine Name */}
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                            Medicine Name <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Enter medicine name"
                                            className="h-11"
                                            error={errors.name}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Generic Name */}
                                    <div className="space-y-2">
                                        <label htmlFor="generic_name" className="block text-sm font-medium text-gray-700">
                                            Generic Name
                                        </label>
                                        <Input
                                            id="generic_name"
                                            name="generic_name"
                                            value={data.generic_name}
                                            onChange={(e) => setData('generic_name', e.target.value)}
                                            placeholder="Enter generic name"
                                            className="h-11"
                                            error={errors.generic_name}
                                        />
                                        {errors.generic_name && (
                                            <p className="text-sm text-red-600 mt-1">{errors.generic_name}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Category & Manufacturer Section */}
                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-gray-900 mb-6 pb-2 border-b border-gray-200">
                                    Category & Manufacturer
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Medicine Type Combobox */}
                                    <div className="relative space-y-2" ref={dropdownRef}>
                                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                                            Medicine Type <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                ref={inputRef}
                                                id="type"
                                                name="type"
                                                type="text"
                                                value={data.type}
                                                onChange={handleInputChange}
                                                onFocus={handleInputFocus}
                                                placeholder="Type or select medicine type"
                                                className={`block w-full h-11 px-4 py-2 rounded-lg border shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm pr-10 transition-colors ${
                                                    errors.type ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                                                }`}
                                                autoComplete="off"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsOpen(!isOpen)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                            >
                                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>

                                        {isOpen && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                                {filteredTypes.length > 0 ? (
                                                    filteredTypes.map((type, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => handleTypeSelect(type)}
                                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm border-b border-gray-50 last:border-b-0 transition-colors"
                                                        >
                                                            {type}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-sm text-gray-500">
                                                        No matching types found. You can type a new one.
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {errors.type && (
                                            <p className="text-sm text-red-600 mt-1">{errors.type}</p>
                                        )}
                                    </div>

                                    {/* Manufacturer Combobox */}
                                    <div className="relative space-y-2" ref={manufacturerDropdownRef}>
                                        <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700">
                                            Manufacturer
                                        </label>
                                        <div className="relative">
                                            <input
                                                ref={manufacturerInputRef}
                                                id="manufacturer"
                                                name="manufacturer"
                                                type="text"
                                                value={data.manufacturer}
                                                onChange={handleManufacturerChange}
                                                onFocus={handleManufacturerFocus}
                                                placeholder="Type or select manufacturer"
                                                className={`block w-full h-11 px-4 py-2 rounded-lg border shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm pr-10 transition-colors ${
                                                    errors.manufacturer ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                                                }`}
                                                autoComplete="off"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsManufacturerOpen(!isManufacturerOpen)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                            >
                                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isManufacturerOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>

                                        {isManufacturerOpen && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                                {filteredManufacturers.length > 0 ? (
                                                    filteredManufacturers.map((manufacturer, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => handleManufacturerSelect(manufacturer)}
                                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm border-b border-gray-50 last:border-b-0 transition-colors"
                                                        >
                                                            {manufacturer}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-sm text-gray-500">
                                                        No matching manufacturers found. You can type a new one.
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {errors.manufacturer && (
                                            <p className="text-sm text-red-600 mt-1">{errors.manufacturer}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Additional Details Section */}
                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-gray-900 mb-6 pb-2 border-b border-gray-200">
                                    Additional Details
                                </h3>
                                <div className="space-y-6">
                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                            Description
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows={4}
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Enter medicine description, usage instructions, or additional notes..."
                                            className={`block w-full px-4 py-3 rounded-lg border shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm transition-colors resize-none ${
                                                errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.description && (
                                            <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                                        )}
                                    </div>

                                    {/* Active Status */}
                                    <div className="flex items-start space-x-3">
                                        <div className="flex items-center h-5">
                                            <input
                                                id="is_active"
                                                name="is_active"
                                                type="checkbox"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                            />
                                        </div>
                                        <div className="text-sm">
                                            <label htmlFor="is_active" className="font-medium text-gray-900">
                                                Active Status
                                            </label>
                                            <p className="text-gray-500">
                                                This medicine will be available for prescription when active.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="bg-gray-50 px-8 py-6 border-t border-gray-100">
                            <div className="flex justify-between w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    href={route('medicines.index')}
                                    className="px-6 py-2 h-11"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    isLoading={processing}
                                    className="px-6 py-2 h-11 bg-blue-600 hover:bg-blue-700"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Medicine
                                </Button>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AdminLayout>
    );
}
