import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';
import { Head, useForm } from '@inertiajs/react';
import { ChevronDown, Pill, Save, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

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
            const filtered = allTypes.filter((type) => type.toLowerCase().includes(data.type.toLowerCase()));
            setFilteredTypes(filtered);
        } else {
            setFilteredTypes(allTypes);
        }
    }, [data.type, allTypes]);

    useEffect(() => {
        if (data.manufacturer) {
            const filtered = manufacturers.filter((manufacturer) => manufacturer.toLowerCase().includes(data.manufacturer.toLowerCase()));
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

            <div className="mx-auto max-w-5xl p-6">
                <Card className="border-0 bg-white shadow-lg">
                    <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                            <div className="mr-3 rounded-lg bg-blue-500 p-2">
                                <Pill className="h-6 w-6 text-white" />
                            </div>
                            Add New Medicine
                        </CardTitle>
                        <CardDescription className="mt-2 text-gray-600">
                            Enter the medicine details below. Fields marked with * are required.
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="p-8">
                            {/* Basic Information Section */}
                            <div className="mb-8">
                                <h3 className="mb-6 border-b border-gray-200 pb-2 text-lg font-medium text-gray-900">Basic Information</h3>
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
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
                                        {errors.generic_name && <p className="mt-1 text-sm text-red-600">{errors.generic_name}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Category & Manufacturer Section */}
                            <div className="mb-8">
                                <h3 className="mb-6 border-b border-gray-200 pb-2 text-lg font-medium text-gray-900">Category & Manufacturer</h3>
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                                                className={`block h-11 w-full rounded-lg border px-4 py-2 pr-10 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm ${
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
                                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                                {filteredTypes.length > 0 ? (
                                                    filteredTypes.map((type, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => handleTypeSelect(type)}
                                                            className="w-full border-b border-gray-50 px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
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

                                        {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
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
                                                className={`block h-11 w-full rounded-lg border px-4 py-2 pr-10 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm ${
                                                    errors.manufacturer
                                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                        : 'border-gray-300'
                                                }`}
                                                autoComplete="off"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsManufacturerOpen(!isManufacturerOpen)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                            >
                                                <ChevronDown
                                                    className={`h-4 w-4 text-gray-400 transition-transform ${isManufacturerOpen ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                        </div>

                                        {isManufacturerOpen && (
                                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                                {filteredManufacturers.length > 0 ? (
                                                    filteredManufacturers.map((manufacturer, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => handleManufacturerSelect(manufacturer)}
                                                            className="w-full border-b border-gray-50 px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
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

                                        {errors.manufacturer && <p className="mt-1 text-sm text-red-600">{errors.manufacturer}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Additional Details Section */}
                            <div className="mb-8">
                                <h3 className="mb-6 border-b border-gray-200 pb-2 text-lg font-medium text-gray-900">Additional Details</h3>
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
                                            className={`block w-full resize-none rounded-lg border px-4 py-3 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm ${
                                                errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                                    </div>

                                    {/* Active Status */}
                                    <div className="flex items-start space-x-3">
                                        <div className="flex h-5 items-center">
                                            <input
                                                id="is_active"
                                                name="is_active"
                                                type="checkbox"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="text-sm">
                                            <label htmlFor="is_active" className="font-medium text-gray-900">
                                                Active Status
                                            </label>
                                            <p className="text-gray-500">This medicine will be available for prescription when active.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="border-t border-gray-100 bg-gray-50 px-8 py-6">
                            <div className="flex w-full justify-between">
                                <Button type="button" variant="outline" href={route('medicines.index')} className="h-11 px-6 py-2">
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    isLoading={processing}
                                    className="h-11 bg-blue-600 px-6 py-2 hover:bg-blue-700"
                                >
                                    <Save className="mr-2 h-4 w-4" />
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
