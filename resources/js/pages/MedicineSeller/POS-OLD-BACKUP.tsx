import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Phone,
  Calculator,
  User,
  Package,
  Printer,
  X
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

  const { data, setData, post, processing, errors, reset } = useForm({
    items: [],
    patient_id: '',
    discount: 0,
    discount_type: 'amount',
    tax: 0,
    paid_amount: 0,
    customer_name: '',
    customer_phone: '',
  });

  // Search patients by phone
  useEffect(() => {
    if (phoneSearch.length >= 3) {
      const filtered = recentCustomers.filter(patient =>
        patient.phone.includes(phoneSearch) ||
        patient.name.toLowerCase().includes(phoneSearch.toLowerCase())
      );
      setFilteredPatients(filtered.slice(0, 5));
    } else {
      setFilteredPatients([]);
    }
  }, [phoneSearch, recentCustomers]);

  const formatCurrency = (amount: number) => {
    return `৳${Math.round(amount)}`;
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
    const availableStock = medicine.stocks.find(s => s.available_quantity > 0);
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
        const availableStock = item.medicine.stocks.find(s => s.id === stockId);
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
    setData('customer_phone', phoneSearch);
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

    // Check if discount exceeds 10%
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
      customer_phone: data.customer_phone,
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
      name: "Eye Hospital Pharmacy",
      address: "123 Medical Center, Dhaka-1000, Bangladesh",
      phone: "+880 1234-567890",
      email: "pharmacy@eyehospital.com",
      license: "DL-12345"
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
              @media print {
                body * {
                  visibility: hidden;
                }
                .print-area, .print-area * {
                  visibility: visible;
                }
                .print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  max-width: 100%;
                  transform: scale(0.95);
                  transform-origin: top left;
                  background: white !important;
                  color: black !important;
                  box-sizing: border-box;
                  margin-top: 20px;
                  margin-left: 15px;
                  margin-right: 15px;
                  padding: 10px;
                }
                .no-print {
                  display: none !important;
                }
                table {
                  border-collapse: collapse !important;
                  width: 100% !important;
                  table-layout: fixed;
                }
                th, td {
                  border: 1px solid #000 !important;
                  padding: 6px !important;
                  text-align: left !important;
                  font-size: 12px !important;
                  word-wrap: break-word;
                }
              }
              @page {
                size: A4 portrait;
                margin: 12mm;
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
              fontFamily: 'Arial, sans-serif',
              backgroundColor: 'white',
              color: 'black',
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              {/* Header */}
              <div style={{
                borderBottom: '2px solid black',
                paddingBottom: '16px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div>
                  <h1 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'black',
                    margin: '0 0 8px 0'
                  }}>
                    {companyInfo.name}
                  </h1>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <p style={{ margin: '2px 0' }}>{companyInfo.address}</p>
                    <p style={{ margin: '2px 0' }}>Phone: {companyInfo.phone}</p>
                    <p style={{ margin: '2px 0' }}>Email: {companyInfo.email}</p>
                    <p style={{ margin: '2px 0' }}>License: {companyInfo.license}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: 'black',
                    margin: '0 0 8px 0'
                  }}>
                    INVOICE
                  </h2>
                  <div style={{ fontSize: '12px' }}>
                    <p style={{ margin: '2px 0', fontWeight: 'bold' }}>
                      Invoice #: {completedSale.invoice_number}
                    </p>
                    <p style={{ margin: '2px 0' }}>Date: {formatDate(completedSale.sale_date)}</p>
                    <p style={{ margin: '2px 0' }}>Cashier: {completedSale.sold_by.name}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'black',
                  margin: '0 0 8px 0'
                }}>
                  Bill To:
                </h3>
                <div style={{ fontSize: '12px', color: 'black' }}>
                  <p style={{ margin: '2px 0', fontWeight: 'bold' }}>
                    {completedSale.patient?.name || 'Walk-in Customer'}
                  </p>
                  {completedSale.patient?.phone && (
                    <p style={{ margin: '2px 0' }}>Phone: {completedSale.patient.phone}</p>
                  )}
                  {completedSale.patient?.email && (
                    <p style={{ margin: '2px 0' }}>Email: {completedSale.patient.email}</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: '24px' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid black'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        #
                      </th>
                      <th style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        Medicine
                      </th>
                      <th style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        Batch
                      </th>
                      <th style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        Qty
                      </th>
                      <th style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'right',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        Unit Price
                      </th>
                      <th style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'right',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedSale.items.map((item, index) => (
                      <tr key={item.id}>
                        <td style={{
                          border: '1px solid black',
                          padding: '8px',
                          fontSize: '12px'
                        }}>
                          {index + 1}
                        </td>
                        <td style={{
                          border: '1px solid black',
                          padding: '8px',
                          fontSize: '12px'
                        }}>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>
                              {item.medicine_stock.medicine.name}
                            </div>
                            {item.medicine_stock.medicine.generic_name && (
                              <div style={{
                                fontSize: '10px',
                                color: '#666',
                                marginTop: '2px'
                              }}>
                                {item.medicine_stock.medicine.generic_name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{
                          border: '1px solid black',
                          padding: '8px',
                          fontSize: '12px'
                        }}>
                          {item.medicine_stock.batch_number}
                        </td>
                        <td style={{
                          border: '1px solid black',
                          padding: '8px',
                          fontSize: '12px',
                          textAlign: 'center'
                        }}>
                          {item.quantity} {item.medicine_stock.medicine.unit}
                        </td>
                        <td style={{
                          border: '1px solid black',
                          padding: '8px',
                          fontSize: '12px',
                          textAlign: 'right'
                        }}>
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td style={{
                          border: '1px solid black',
                          padding: '8px',
                          fontSize: '12px',
                          textAlign: 'right',
                          fontWeight: 'bold'
                        }}>
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '24px'
              }}>
                <div style={{ width: '250px' }}>
                  <div style={{
                    borderTop: '1px solid black',
                    paddingTop: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      marginBottom: '4px'
                    }}>
                      <span>Subtotal:</span>
                      <span>{formatCurrency(completedSale.subtotal)}</span>
                    </div>

                    {discountToShow > 0 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        marginBottom: '4px'
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
                        fontSize: '12px',
                        marginBottom: '4px'
                      }}>
                        <span>Tax:</span>
                        <span>+{formatCurrency(completedSale.tax)}</span>
                      </div>
                    )}

                    <div style={{
                      borderTop: '2px solid black',
                      paddingTop: '8px',
                      marginTop: '8px'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        <span>Total Amount:</span>
                        <span>{formatCurrency(totalToShow)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                borderTop: '1px solid #ccc',
                paddingTop: '16px',
                marginTop: '32px'
              }}>
                <div style={{
                  textAlign: 'center',
                  fontSize: '10px',
                  color: '#666'
                }}>
                  <p style={{ margin: '2px 0' }}>Thank you for your business!</p>
                  <p style={{ margin: '2px 0' }}>This is a computer generated invoice.</p>
                  <p style={{ margin: '8px 0 2px 0' }}>
                    For any queries, please contact us at {companyInfo.phone} or {companyInfo.email}
                  </p>
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
                  const availableStock = medicine.stocks.find(s => s.available_quantity > 0);
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
          <div className="w-96 flex flex-col bg-white shadow-lg max-h-[calc(100vh-64px)] overflow-hidden">
            {/* Patient Search */}
            <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
              <label className="block text-xs font-medium text-gray-700 mb-2 uppercase">Customer</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by phone or name..."
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              {filteredPatients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => selectPatient(patient)}
                      className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-sm">{patient.name}</div>
                      <div className="text-xs text-gray-600">{patient.phone}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Patient */}
              {selectedPatient && (
                <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">{selectedPatient.name}</div>
                      <div className="text-xs text-gray-600">{selectedPatient.phone}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-sm text-gray-900">Cart Items</span>
                  </div>
                  <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">{cart.length}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">No items in cart</p>
                    <p className="text-xs text-gray-400 mt-1">Add products to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => {
                      const availableStock = item.medicine.stocks.find(s => s.id === item.medicine_stock_id);

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
            </div>

            {/* Checkout */}
            {cart.length > 0 && (
              <form onSubmit={handleSubmit} className="border-t-2 p-4 bg-white flex-shrink-0">
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
                    placeholder={`${Math.round(totalAmount)}`}
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

                {/* Complete Sale Button */}
                <button
                  type="submit"
                  disabled={processing || cart.length === 0 || isDiscountExceeded}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 text-white py-3 rounded-lg font-bold text-base transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
                >
                  <Calculator className="w-5 h-5" />
                  {isDiscountExceeded ? 'Discount Too High' : 'Complete Sale'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Invoice Print Modal */}
        <InvoicePrintModal />
      </div>
    </AdminLayout>
  );
}
