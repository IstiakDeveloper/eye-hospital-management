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

  const { data, setData, post, processing, errors, reset } = useForm({
    items: [],
    patient_id: '',
    discount: 0,
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
  const totalAmount = subtotal - (data.discount || 0) + (data.tax || 0);

  // Auto-set paid amount to total amount
  useEffect(() => {
    setData('paid_amount', totalAmount);
  }, [totalAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Please add items to cart');
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
      discount: data.discount,
      tax: data.tax,
      total_amount: totalAmount,
      paid_amount: data.paid_amount,
      due_amount: Math.max(0, totalAmount - data.paid_amount),
      payment_status: data.paid_amount >= totalAmount ? 'paid' : 'partial',
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
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
              <div className="flex gap-2">
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

                    {completedSale.discount > 0 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        marginBottom: '4px'
                      }}>
                        <span>Discount:</span>
                        <span>-{formatCurrency(completedSale.discount)}</span>
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
                        <span>{formatCurrency(completedSale.total_amount)}</span>
                      </div>
                    </div>

                    <div style={{
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid #ccc'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        marginBottom: '4px'
                      }}>
                        <span>Paid Amount:</span>
                        <span>{formatCurrency(completedSale.paid_amount)}</span>
                      </div>

                      {completedSale.due_amount > 0 && (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: 'red'
                        }}>
                          <span>Due Amount:</span>
                          <span>{formatCurrency(completedSale.due_amount)}</span>
                        </div>
                      )}

                      {completedSale.paid_amount > completedSale.total_amount && (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: 'green'
                        }}>
                          <span>Change:</span>
                          <span>{formatCurrency(completedSale.paid_amount - completedSale.total_amount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px' }}>
                  <span style={{ fontWeight: 'bold' }}>Payment Status: </span>
                  <span style={{
                    fontWeight: 'bold',
                    color: completedSale.payment_status === 'paid' ? 'green' :
                      completedSale.payment_status === 'partial' ? 'orange' : 'red'
                  }}>
                    {completedSale.payment_status.toUpperCase()}
                  </span>
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

              {/* Due Amount Warning */}
              {completedSale.due_amount > 0 && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#ffebee',
                  border: '1px solid #f44336',
                  borderRadius: '4px'
                }}>
                  <p style={{
                    fontSize: '12px',
                    color: '#d32f2f',
                    fontWeight: 'bold',
                    margin: '0'
                  }}>
                    ⚠️ Due Amount: {formatCurrency(completedSale.due_amount)} - Please clear the due amount.
                  </p>
                </div>
              )}
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
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">POS System</h1>
            <div className="text-sm text-gray-600">
              Today: {todaySalesCount} • Last: {lastInvoiceNumber}
            </div>
          </div>
          <div className="text-lg font-bold text-green-600">
            {formatCurrency(totalAmount)}
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
                      className={`p-3 border rounded-lg transition-all cursor-pointer ${
                        hasStock
                          ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 bg-white'
                          : 'border-gray-100 bg-gray-50 opacity-60'
                      }`}
                      onClick={() => hasStock && addToCart(medicine)}
                    >
                      <div className="text-center">
                        <div className="mb-2">
                          <Package className={`w-6 h-6 mx-auto ${hasStock ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                        <h3 className="font-medium text-xs text-gray-900 mb-1 line-clamp-2">
                          {medicine.name}
                        </h3>
                        {medicine.generic_name && (
                          <p className="text-xs text-gray-500 mb-1 line-clamp-1">
                            {medicine.generic_name}
                          </p>
                        )}
                        <div className="text-xs text-gray-600 mb-2">
                          Stock: {availableStock?.available_quantity || 0}
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(availableStock?.sale_price || 0)}
                        </div>
                        {cartItem && (
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            Cart: {cartItem.quantity}
                          </div>
                        )}
                        {!hasStock && (
                          <div className="text-xs text-red-500 font-medium mt-1">
                            Out of Stock
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
          <div className="w-80 flex flex-col bg-white">
            {/* Patient Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Phone number..."
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {selectedPatient && (
                  <button
                    onClick={clearPatient}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">{selectedPatient.name}</div>
                      <div className="text-xs text-gray-600">{selectedPatient.phone}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="flex-1 flex flex-col">
              <div className="px-3 py-2 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Cart ({cart.length})</span>
                  <ShoppingCart className="w-4 h-4 text-gray-600" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No items in cart</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => {
                      const availableStock = item.medicine.stocks.find(s => s.id === item.medicine_stock_id);

                      return (
                        <div key={item.medicine_stock_id} className="p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs text-gray-900 truncate">
                                {item.medicine.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                Available: {availableStock?.available_quantity}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.medicine_stock_id)}
                              className="p-1 rounded text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQuantity(item.medicine_stock_id, item.quantity - 1)}
                                className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.medicine_stock_id, item.quantity + 1)}
                                disabled={item.quantity >= (availableStock?.available_quantity || 0)}
                                className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600">
                                @{formatCurrency(item.unit_price)}
                              </div>
                              <div className="text-sm font-medium text-green-600">
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
              <form onSubmit={handleSubmit} className="border-t p-3 bg-gray-50">
                {/* Quick Calculations */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input
                    type="number"
                    placeholder="Discount"
                    value={data.discount || ''}
                    onChange={(e) => setData('discount', parseFloat(e.target.value) || 0)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Tax"
                    value={data.tax || ''}
                    onChange={(e) => setData('tax', parseFloat(e.target.value) || 0)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Total Display */}
                <div className="space-y-1 mb-3 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {data.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(data.discount)}</span>
                    </div>
                  )}
                  {data.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>+{formatCurrency(data.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-1">
                    <span>Total:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Paid Amount */}
                <div className="mb-3">
                  <input
                    type="number"
                    placeholder="Paid Amount"
                    value={data.paid_amount || ''}
                    onChange={(e) => setData('paid_amount', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {data.paid_amount > totalAmount && (
                    <p className="text-sm mt-1 text-amber-600">
                      Change: {formatCurrency(data.paid_amount - totalAmount)}
                    </p>
                  )}
                </div>

                {/* Complete Sale Button */}
                <button
                  type="submit"
                  disabled={processing || cart.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  Complete Sale
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
