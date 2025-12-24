import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Calculator,
  User,
  Package,
  Printer,
  X,
  Hash
} from 'lucide-react';

interface Medicine {
  id: number;
  name: string;
  generic_name: string;
  standard_sale_price: number;
  unit: string;
  stocks: {
    id: number;
    available_quantity: number;
    sale_price: number;
    expiry_date: string;
  }[];
}

interface Patient {
  id: number;
  patient_id: string;
  name: string;
  phone: string;
  email?: string;
}

interface POSProps {
  medicines: Medicine[];
  recentCustomers: Patient[];
  todaySalesCount: number;
  lastInvoiceNumber: string;
}

interface CartItem {
  medicine_stock_id: number;
  medicine: Medicine;
  quantity: number;
  unit_price: number;
}

interface CompletedSale {
  invoice_number: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  discount_type?: 'amount' | 'percent';
  discount_percent?: number;
  tax: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  patient: {
    name: string;
    phone: string;
    email?: string;
  } | null;
  sold_by: {
    name: string;
  };
  items: {
    id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    medicine_stock: {
      batch_number: string;
      medicine: {
        name: string;
        generic_name: string;
        unit: string;
      };
    };
  }[];
}

export default function POS({ medicines, recentCustomers, todaySalesCount, lastInvoiceNumber }: POSProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [printWithoutDiscount, setPrintWithoutDiscount] = useState(false);

  const { data, setData, processing, reset } = useForm({
    items: [],
    patient_id: '',
    discount: 0,
    discount_type: 'amount',
    tax: 0,
    paid_amount: 0,
    customer_name: '',
    customer_phone: '',
    sale_date: new Date().toISOString().split('T')[0],
  });

  // Search patients by ID, phone, or name using API
  useEffect(() => {
    if (phoneSearch.length >= 1) {
      const timeoutId = setTimeout(() => {
        // Make API call to search patients
        fetch(`/medicine-seller/search-patients?q=${encodeURIComponent(phoneSearch)}`)
          .then(response => response.json())
          .then(data => {
            setFilteredPatients(data.slice(0, 10));
          })
          .catch(error => {
            console.error('Error searching patients:', error);
            setFilteredPatients([]);
          });
      }, 300); // Debounce for 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setFilteredPatients([]);
    }
  }, [phoneSearch]);

  const formatCurrency = (amount: number) => {
    const numAmount = Number(amount) || 0;
    return `৳${numAmount.toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (medicine: Medicine) => {
    const availableStock = medicine.stocks?.find(s => s.available_quantity > 0);
    if (!availableStock) return;

    const existingItem = cart.find(item => item.medicine_stock_id === availableStock.id);

    if (existingItem) {
      if (existingItem.quantity < availableStock.available_quantity) {
        setCart(cart.map(item =>
          item.medicine_stock_id === availableStock.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, {
        medicine_stock_id: availableStock.id,
        medicine,
        quantity: 1,
        unit_price: availableStock.sale_price
      }]);
    }
  };

  const updateQuantity = (stockId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.medicine_stock_id !== stockId));
    } else {
      const item = cart.find(item => item.medicine_stock_id === stockId);
      if (item) {
        const availableStock = item.medicine.stocks?.find(s => s.id === stockId);
        if (availableStock && newQuantity <= availableStock.available_quantity) {
          setCart(cart.map(cartItem =>
            cartItem.medicine_stock_id === stockId
              ? { ...cartItem, quantity: newQuantity }
              : cartItem
          ));
        }
      }
    }
  };

  const removeFromCart = (stockId: number) => {
    setCart(cart.filter(item => item.medicine_stock_id !== stockId));
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setData('patient_id', patient.id.toString());
    setData('customer_name', patient.name);
    setData('customer_phone', patient.phone);
    setPhoneSearch(patient.phone);
    setFilteredPatients([]);
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setData('patient_id', '');
    setData('customer_name', '');
    setData('customer_phone', '');
    setPhoneSearch('');
    setFilteredPatients([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  // Calculate discount amount based on type
  const discountValue = ((): number => {
    const raw = Number(data.discount || 0);
    if (data.discount_type === 'percent') {
      return (subtotal * (raw / 100));
    }
    return raw;
  })();

  // Calculate discount percentage
  const discountPercent = subtotal > 0 ? (discountValue / subtotal) * 100 : 0;

  // Check if discount exceeds 10% (strictly greater than 10, with tolerance for floating point)
  const isDiscountExceeded = discountPercent > 10.01;

  const totalAmount = subtotal - discountValue + (Number(data.tax || 0));

  // Auto-set paid amount to total amount when total changes
  useEffect(() => {
    if (totalAmount >= 0) {
      setData((prevData) => ({
        ...prevData,
        paid_amount: totalAmount
      }));
    }
  }, [totalAmount, subtotal, discountValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    if (!selectedPatient && !data.customer_name.trim()) {
      alert('Please select a patient or enter customer name');
      return;
    }

    if (isDiscountExceeded) {
      alert('Discount cannot exceed 10% of subtotal!');
      return;
    }

    const cartItems = cart.map(item => ({
      medicine_stock_id: item.medicine_stock_id,
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    // Create sale data for invoice
    const saleData: CompletedSale = {
      invoice_number: `SL-${Date.now()}`,
      sale_date: new Date().toISOString(),
      subtotal: subtotal,
      discount: discountValue,
      discount_type: data.discount_type as 'amount' | 'percent',
      discount_percent: data.discount_type === 'percent' ? Number(data.discount) : undefined,
      tax: Number(data.tax || 0),
      total_amount: totalAmount,
      paid_amount: Number(data.paid_amount || 0),
      due_amount: Math.max(0, totalAmount - Number(data.paid_amount || 0)),
      payment_status: Number(data.paid_amount || 0) >= totalAmount ? 'paid' : 'partial',
      patient: selectedPatient ? {
        name: selectedPatient.name,
        phone: selectedPatient.phone,
        email: selectedPatient.email
      } : (data.customer_name ? {
        name: data.customer_name,
        phone: data.customer_phone,
        email: undefined
      } : null),
      sold_by: {
        name: 'Medicine Seller' // You can get this from auth
      },
      items: cart.map((item, index) => ({
        id: index + 1,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        medicine_stock: {
          batch_number: 'BATCH-001',
          medicine: {
            name: item.medicine.name,
            generic_name: item.medicine.generic_name || '',
            unit: item.medicine.unit
          }
        }
      }))
    };

    router.post('/medicine-seller/pos/sale', {
      items: cartItems,
      patient_id: data.patient_id || null,
      discount: data.discount,
      discount_type: data.discount_type,
      tax: data.tax,
      paid_amount: data.paid_amount,
      customer_name: data.customer_name || 'Walk-in Customer',
      customer_phone: data.customer_phone || '',
      sale_date: data.sale_date,
    }, {
      onSuccess: () => {
        // Set completed sale and show invoice
        setCompletedSale(saleData);
        setShowInvoice(true);

        // Clear cart and form
        setCart([]);
        reset();
        setSelectedPatient(null);
        setPhoneSearch('');
      },
      onError: (errors) => {
        console.error('Sale failed:', errors);
        alert('Sale failed. Please try again.');
      }
    });
  };

  // Invoice Print Component
  const InvoicePrintModal = () => {
    if (!showInvoice || !completedSale) return null;

    const companyInfo = {
      name: "Naogaon Islamia Eye Hospital & Phaco Centre",
      address: "Adjacent Circuit House, Main Road, Naogaon",
      phone: "01307-885566, 01334-925910",
      email: "niehpc@gmail.com"
    };

    const handlePrint = () => {
      window.print();
    };

    const closeInvoice = () => {
      setShowInvoice(false);
      setCompletedSale(null);
      setPrintWithoutDiscount(false);
    };

    // Calculate total with or without discount
    const discountToShow = printWithoutDiscount ? 0 : completedSale.discount;
    const totalToShow = completedSale.subtotal - discountToShow + completedSale.tax;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="p-6">
            {/* Print Styles */}
            <style>{`
    @page {
        size: 80mm auto;
        margin: 0;
    }

    @media print {
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0;
            padding: 0;
        }

        html, body {
            width: 80mm !important;
            height: auto !important;
            overflow: visible !important;
        }

        body * {
            visibility: hidden;
        }

        .print-area {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 3mm !important;
            width: 70mm !important;
            margin: 0 !important;
            margin-left: 5mm !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
        }

        .print-area * {
            visibility: visible !important;
            page-break-inside: avoid !important;
        }

        .no-print {
            display: none !important;
            visibility: hidden !important;
        }
    }
`}</style>

            {/* Print/Close Buttons */}
            <div className="no-print mb-4 flex justify-between items-center border-b pb-4">
              <h2 className="text-lg font-semibold">Invoice Preview</h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={printWithoutDiscount}
                    onChange={(e) => setPrintWithoutDiscount(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Print without discount
                </label>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={closeInvoice}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>

            {/* Printable Invoice */}
            <div className="print-area" style={{
              fontFamily: 'Courier New, monospace',
              backgroundColor: 'white',
              color: 'black',
              fontSize: '11px',
              lineHeight: '1.2',
              width: '70mm',
              maxWidth: '70mm',
              margin: '0 auto',
              padding: '5mm'
            }}>
              {/* Header */}
              <div style={{
                textAlign: 'center',
                borderBottom: '1px dashed black',
                paddingBottom: '6px',
                marginBottom: '6px'
              }}>
                <h1 style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  margin: '0 0 3px 0',
                  textTransform: 'uppercase'
                }}>
                  {companyInfo.name}
                </h1>
                <div style={{ fontSize: '9px', lineHeight: '1.3' }}>
                  <div>{companyInfo.address}</div>
                  <div>Tel: {companyInfo.phone}</div>
                  <div>Email: {companyInfo.email}</div>
                </div>
              </div>

              {/* Invoice Info */}
              <div style={{
                borderBottom: '1px dashed black',
                paddingBottom: '6px',
                marginBottom: '6px',
                fontSize: '9px'
              }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '3px' }}>
                  INVOICE
                </div>
                <div>Invoice: {completedSale.invoice_number}</div>
                <div>Date: {formatDate(completedSale.sale_date)}</div>
                <div>Cashier: {completedSale.sold_by.name}</div>
              </div>

              {/* Customer Info */}
              <div style={{
                borderBottom: '1px dashed black',
                paddingBottom: '6px',
                marginBottom: '6px',
                fontSize: '9px'
              }}>
                <div style={{ fontWeight: 'bold' }}>Customer:</div>
                <div>{completedSale.patient?.name || 'Walk-in Customer'}</div>
                {completedSale.patient?.phone && (
                  <div>Tel: {completedSale.patient.phone}</div>
                )}
              </div>

              {/* Items */}
              <div style={{
                borderBottom: '1px dashed black',
                paddingBottom: '6px',
                marginBottom: '6px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  fontSize: '9px',
                  marginBottom: '3px',
                  borderBottom: '1px solid black',
                  paddingBottom: '2px'
                }}>
                  <span>ITEM</span>
                  <span>AMOUNT</span>
                </div>
                {completedSale.items.map((item) => (
                  <div key={item.id} style={{ marginBottom: '4px', fontSize: '9px' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {item.medicine_stock.medicine.name}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '1px'
                    }}>
                      <span>
                        {item.quantity} {item.medicine_stock.medicine.unit} x {formatCurrency(item.unit_price)}
                      </span>
                      <span style={{ fontWeight: 'bold' }}>
                        {formatCurrency(item.total_price)}
                      </span>
                    </div>
                    {item.medicine_stock.medicine.generic_name && (
                      <div style={{ fontSize: '8px', color: '#666' }}>
                        ({item.medicine_stock.medicine.generic_name})
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ fontSize: '9px', marginBottom: '6px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '2px'
                }}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(completedSale.subtotal)}</span>
                </div>

                {discountToShow > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '2px'
                  }}>
                    <span>
                      Discount{completedSale.discount_type === 'percent' && completedSale.discount_percent ? ` (${completedSale.discount_percent}%)` : ''}:
                    </span>
                    <span>-{formatCurrency(discountToShow)}</span>
                  </div>
                )}

                {completedSale.tax > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '2px'
                  }}>
                    <span>Tax:</span>
                    <span>+{formatCurrency(completedSale.tax)}</span>
                  </div>
                )}

                <div style={{
                  borderTop: '1px solid black',
                  paddingTop: '3px',
                  marginTop: '3px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}>
                  <span>TOTAL:</span>
                  <span>{formatCurrency(totalToShow)}</span>
                </div>

                {/* Payment Status */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '3px',
                  fontSize: '9px'
                }}>
                  <span>Payment:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {completedSale.payment_status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                borderTop: '1px dashed black',
                paddingTop: '6px',
                textAlign: 'center',
                fontSize: '8px',
                lineHeight: '1.3'
              }}>
                <div style={{ marginBottom: '3px', fontWeight: 'bold' }}>
                  Thank you for your business!
                </div>
                <div>Tel: {companyInfo.phone}</div>
                <div style={{ marginTop: '3px' }}>
                  This is a computer generated invoice
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title="POS">
      <Head title="POS" />

      <div className="h-screen flex flex-col bg-gray-50">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">POS System</h1>
            <div className="text-sm text-blue-100">
              Today's Sales: {todaySalesCount} | Last Invoice: {lastInvoiceNumber}
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow">
            <div className="text-xs text-gray-600 uppercase">Total</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Products */}
          <div className="flex-1 flex flex-col bg-white border-r">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {filteredMedicines.map((medicine) => {
                  const availableStock = medicine.stocks?.find(s => s.available_quantity > 0);
                  const cartItem = cart.find(item => item.medicine_stock_id === availableStock?.id);
                  const hasStock = availableStock && availableStock.available_quantity > 0;

                  return (
                    <div
                      key={medicine.id}
                      className={`p-3 border-2 rounded-xl transition-all cursor-pointer shadow-sm ${
                        hasStock
                          ? 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 bg-white hover:shadow-md'
                          : 'border-gray-100 bg-gray-50 opacity-60'
                      } ${cartItem ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                      onClick={() => hasStock && addToCart(medicine)}
                    >
                      <div className="text-center">
                        <div className="mb-2">
                          <Package className={`w-7 h-7 mx-auto ${hasStock ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                        <h3 className="font-semibold text-xs text-gray-900 mb-1 line-clamp-2 min-h-[2rem]">
                          {medicine.name}
                        </h3>
                        {medicine.generic_name && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                            {medicine.generic_name}
                          </p>
                        )}
                        <div className={`text-xs font-medium mb-2 ${hasStock ? 'text-gray-600' : 'text-red-500'}`}>
                          {hasStock ? `Stock: ${availableStock?.available_quantity}` : 'Out of Stock'}
                        </div>
                        <div className="text-base font-bold text-green-600 mb-1">
                          {formatCurrency(availableStock?.sale_price || 0)}
                        </div>
                        {cartItem && (
                          <div className="mt-2 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                            In Cart: {cartItem.quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel - Cart & Checkout */}
          <div className="w-96 flex flex-col bg-white shadow-lg h-[calc(100vh-64px)]">
            {/* Customer & Sale Date Section */}
            <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
              {/* Sale Date */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase">Sale Date</label>
                <input
                  type="date"
                  value={data.sale_date}
                  onChange={(e) => setData('sale_date', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Patient Search */}
              <label className="block text-xs font-medium text-gray-700 mb-2 uppercase">Customer (Optional)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by Patient ID, phone or name..."
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  disabled={!!selectedPatient}
                  className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                {selectedPatient && (
                  <button
                    onClick={clearPatient}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 text-xl font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Patient Results */}
              {filteredPatients.length > 0 && !selectedPatient && (
                <div className="absolute z-20 w-[calc(100%-2rem)] mt-1 bg-white border-2 border-blue-300 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => selectPatient(patient)}
                      className="p-3 hover:bg-blue-100 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900">{patient.name}</span>
                            <span className="flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">
                              <Hash className="w-3 h-3" />
                              {patient.patient_id}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {patient.phone || 'No phone'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Patient */}
              {selectedPatient && (
                <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <User className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-bold text-sm text-gray-900">{selectedPatient.name}</div>
                        <div className="text-xs text-gray-700 mt-0.5">
                          {selectedPatient.phone}
                          {selectedPatient.email && <span className="ml-1">• {selectedPatient.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-3 py-2 rounded-md shadow">
                      <Hash className="w-4 h-4" />
                      <span className="text-base font-bold">{selectedPatient.patient_id}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Walk-in Customer Fields */}
              {!selectedPatient && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-medium text-gray-700 uppercase">Or Enter Walk-in Customer</div>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={data.customer_name}
                    onChange={(e) => setData('customer_name', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number (Optional)"
                    value={data.customer_phone}
                    onChange={(e) => setData('customer_phone', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Scrollable Cart & Checkout Area */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Cart Header */}
              <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-sm text-gray-900">Cart Items</span>
                  </div>
                  <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">{cart.length}</span>
                </div>
              </div>

              {/* Cart Items */}
              <div className="p-4 bg-gray-50">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">No items in cart</p>
                    <p className="text-xs text-gray-400 mt-1">Add products to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => {
                      const availableStock = item.medicine.stocks?.find(s => s.id === item.medicine_stock_id);

                      return (
                        <div key={item.medicine_stock_id} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">
                                {item.medicine.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Stock: {availableStock?.available_quantity} • @{formatCurrency(item.unit_price)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.medicine_stock_id)}
                              className="p-1.5 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                              <button
                                onClick={() => updateQuantity(item.medicine_stock_id, item.quantity - 1)}
                                className="p-1.5 rounded bg-white hover:bg-gray-200 shadow-sm"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.medicine_stock_id, item.quantity + 1)}
                                disabled={item.quantity >= (availableStock?.available_quantity || 0)}
                                className="p-1.5 rounded bg-white hover:bg-gray-200 shadow-sm disabled:bg-gray-100 disabled:opacity-50"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {formatCurrency(item.quantity * item.unit_price)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Checkout Section - Inside scrollable area with bottom padding */}
              {cart.length > 0 && (
                <div className="border-t-2 p-4 bg-white pb-28">
                {/* Quick Calculations */}
                <div className="space-y-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Discount</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={data.discount === 0 ? '' : data.discount}
                          onChange={(e) => {
                            const v = e.target.value;
                            setData('discount', v === '' ? 0 : parseFloat(v));
                          }}
                          className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            isDiscountExceeded ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                      </div>

                      <div>
                        <select
                          value={data.discount_type}
                          onChange={(e) => setData('discount_type', e.target.value)}
                          className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                        >
                          <option value="amount">৳</option>
                          <option value="percent">%</option>
                        </select>
                      </div>
                    </div>
                    {isDiscountExceeded && (
                      <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-xs text-red-700 font-semibold">
                          ⚠️ Discount cannot exceed 10%! Current: {discountPercent.toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </div>


                </div>

                {/* Total Display */}
                <div className="space-y-2 mb-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountValue > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>
                        Discount{data.discount_type === 'percent' ? ` (${data.discount}%)` : ''}:
                      </span>
                      <span className="font-semibold">-{formatCurrency(discountValue)}</span>
                    </div>
                  )}
                  {data.tax > 0 && (
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Tax:</span>
                      <span className="font-semibold">+{formatCurrency(Number(data.tax || 0))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t-2 border-gray-300 pt-2 mt-2 text-gray-900">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Paid Amount */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Paid Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`${totalAmount.toFixed(2)}`}
                    value={data.paid_amount || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setData('paid_amount', v === '' ? 0 : parseFloat(v));
                    }}
                    className="w-full px-3 py-2 text-base font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {Number(data.paid_amount || 0) > totalAmount && (
                    <p className="text-xs mt-1 text-green-600 font-medium">
                      Change: {formatCurrency(Number(data.paid_amount || 0) - totalAmount)}
                    </p>
                  )}
                </div>
                </div>
              )}
            </div>

            {/* Complete Sale Button - FIXED AT BOTTOM RIGHT CORNER */}
            {cart.length > 0 && (
              <div className="absolute bottom-4 right-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={processing || cart.length === 0 || isDiscountExceeded}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-3.5 rounded-lg font-bold text-base transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
                >
                  <Calculator className="w-5 h-5" />
                  {isDiscountExceeded ? 'Discount Too High' : 'Complete Sale'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Print Modal */}
        <InvoicePrintModal />
      </div>
    </AdminLayout>
  );
}
