import React, { useState, useEffect } from 'react';
import { PaymentReceipt, HospitalChargeCategory, HospitalStampConfig } from '../types';
import { api } from '../lib/api';
import { X, Printer, Download, CreditCard, QrCode, Banknote, ShieldCheck, CheckCircle2, Building2, Plus, Trash2, FileText } from 'lucide-react';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientCode: string;
  patientPhone: string;
  patientEmail?: string;
  doctorName?: string;
  department?: string;
  autoShowReceipt?: boolean;
  onPaymentSuccess?: (receipt: PaymentReceipt) => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientCode,
  patientPhone,
  patientEmail,
  doctorName,
  department,
  autoShowReceipt = false,
  onPaymentSuccess
}) => {
  if (!isOpen) return null;

  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI (QR Code)' | 'Card' | 'Net Banking'>('UPI (QR Code)');
  const [transactionRef, setTransactionRef] = useState('');
  const [stampConfig, setStampConfig] = useState<HospitalStampConfig | null>(null);

  const [availableCharges, setAvailableCharges] = useState<HospitalChargeCategory[]>([]);
  
  const [lineItems, setLineItems] = useState<{ description: string; category: string; amount: number }[]>([
    {
      description: doctorName ? `OPD Consultation Fee - Dr. ${doctorName}` : 'Senior OPD Doctor Consultation Charge',
      category: 'Consultation',
      amount: 500
    }
  ]);

  const [newChargeId, setNewChargeId] = useState('');
  const [customItemDesc, setCustomItemDesc] = useState('');
  const [customItemAmount, setCustomItemAmount] = useState('');

  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [receiptGenerated, setReceiptGenerated] = useState<PaymentReceipt | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getChargeCategories().then(setAvailableCharges).catch(console.error);
    api.getHospitalStampConfig().then(setStampConfig).catch(console.error);

    if (isOpen && autoShowReceipt) {
      const autoRcpt: PaymentReceipt = {
        id: `rcpt-${Date.now()}`,
        receipt_number: `SKMH/OPD/2026/${Math.floor(100000 + Math.random() * 900000)}`,
        patient_id: `pat-${Date.now()}`,
        patient_name: patientName,
        patient_code: patientCode || 'SKMH-2026-PAT-OPD',
        phone: patientPhone || '+91 98000 11122',
        email: patientEmail,
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'UPI (QR Code)',
        transaction_ref: 'OPD-PAID-DESK-01',
        items: [
          {
            description: doctorName ? `OPD Doctor Consultation Fee - Dr. ${doctorName}` : 'Senior OPD Consultation Fee',
            category: 'Consultation',
            amount: 500
          }
        ],
        subtotal: 500,
        tax: 0,
        discount: 0,
        total_paid: 500,
        collected_by: 'OPD Desk Receptionist'
      };
      setReceiptGenerated(autoRcpt);
    } else if (isOpen && !autoShowReceipt) {
      setReceiptGenerated(null);
    }
  }, [isOpen, autoShowReceipt, patientName, patientCode, patientPhone, patientEmail, doctorName]);

  const handleAddChargeFromMaster = () => {
    if (!newChargeId) return;
    const found = availableCharges.find(c => c.id === newChargeId);
    if (found) {
      setLineItems(prev => [
        ...prev,
        {
          description: found.service_name,
          category: found.category_name,
          amount: found.charge_amount
        }
      ]);
      setNewChargeId('');
    }
  };

  const handleAddCustomCharge = () => {
    if (!customItemDesc.trim() || !customItemAmount) return;
    setLineItems(prev => [
      ...prev,
      {
        description: customItemDesc.trim(),
        category: 'Other Charges',
        amount: parseFloat(customItemAmount) || 0
      }
    ]);
    setCustomItemDesc('');
    setCustomItemAmount('');
  };

  const handleRemoveItem = (index: number) => {
    setLineItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const subtotal = lineItems.reduce((acc, item) => acc + item.amount, 0);
  const totalPaid = Math.max(0, subtotal + tax - discount);

  const handleGenerateReceipt = async () => {
    if (lineItems.length === 0) {
      alert('Please add at least one charge item to generate the bill.');
      return;
    }

    setSaving(true);
    try {
      const created = await api.addPaymentReceipt({
        patient_id: `pat-${Date.now()}`,
        patient_name: patientName,
        patient_code: patientCode || 'SKMH-2026-PAT-OPD',
        phone: patientPhone || '+91 98000 11122',
        email: patientEmail,
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: paymentMode,
        transaction_ref: transactionRef || (paymentMode === 'UPI (QR Code)' ? 'UPI/OKHDFC/882192' : 'CASH/COUNTER/01'),
        items: lineItems,
        subtotal,
        tax,
        discount,
        total_paid: totalPaid,
        collected_by: 'OPD Desk Receptionist'
      });

      setReceiptGenerated(created);
      if (onPaymentSuccess) {
        onPaymentSuccess(created);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate payment receipt.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl my-auto print:shadow-none print:m-0 print:w-full print:max-w-none border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 sm:px-8 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 print:pb-2 print:static">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0 print:hidden">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight uppercase truncate">
                SHREE KRISHNA MULTISPECIALITY HOSPITAL
              </h2>
              <p className="text-xs text-slate-600 font-bold truncate">
                Official OPD & Clinical Payment Money Receipt • Silvassa (D&NH)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 print:hidden ml-2">
            {receiptGenerated && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4 text-emerald-400" /> Print / Save PDF
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 font-bold text-xs shrink-0 cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 print:p-0">

        {!receiptGenerated ? (
          /* BILL CREATION & PAYMENT MODE SELECTION */
          <div className="space-y-6">
            
            {/* Patient Info Banner */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Patient Name</span>
                <strong className="text-slate-900 text-sm font-extrabold">{patientName}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Patient Code</span>
                <strong className="text-emerald-700 font-mono text-sm">{patientCode || 'SKMH-WALKIN'}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Phone Contact</span>
                <strong className="text-slate-800">{patientPhone || '+91 98000 00000'}</strong>
              </div>
            </div>

            {/* Line Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-slate-800">Hospital Charge Line Items</h3>
                <span className="text-xs font-bold text-emerald-700">{lineItems.length} items added</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Service Description</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-extrabold text-slate-900">{item.description}</td>
                        <td className="p-3 font-semibold text-slate-600">{item.category}</td>
                        <td className="p-3 text-right font-black text-slate-900">₹{item.amount.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Charge Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                
                {/* Add from Master */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2 min-w-0">
                  <label className="block text-[10px] font-extrabold uppercase text-emerald-900 tracking-wider">Add Standard Charge Master</label>
                  <div className="flex items-center gap-2 min-w-0">
                    <select
                      value={newChargeId}
                      onChange={(e) => setNewChargeId(e.target.value)}
                      className="flex-1 min-w-0 h-10 px-3 rounded-xl border border-emerald-200 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 truncate"
                    >
                      <option value="">Select Charge Category / X-Ray / Lab...</option>
                      {availableCharges.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.service_name} (₹{c.charge_amount})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddChargeFromMaster}
                      className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1 shadow cursor-pointer shrink-0 transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>

                {/* Custom Item */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 min-w-0">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-700 tracking-wider">Add Custom Charges</label>
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="text"
                      placeholder="e.g. Dressing / Nebulization"
                      value={customItemDesc}
                      onChange={(e) => setCustomItemDesc(e.target.value)}
                      className="flex-1 min-w-0 h-10 px-3 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-slate-400/20"
                    />
                    <input
                      type="number"
                      placeholder="Amount ₹"
                      value={customItemAmount}
                      onChange={(e) => setCustomItemAmount(e.target.value)}
                      className="w-24 shrink-0 h-10 px-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold text-right focus:outline-none focus:ring-2 focus:ring-slate-400/20"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCharge}
                      className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1 shadow cursor-pointer shrink-0 transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Payment Method Selector & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-4 border-t border-slate-200 items-stretch">
              
              <div className="space-y-3.5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2.5">Select Payment Mode *</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('UPI (QR Code)')}
                      className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMode === 'UPI (QR Code)'
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-md scale-[1.01]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <QrCode className="w-4 h-4 shrink-0 text-emerald-400" /> UPI (QR Code)
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('Cash')}
                      className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMode === 'Cash'
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-md scale-[1.01]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Banknote className="w-4 h-4 shrink-0 text-emerald-400" /> Cash Counter
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('Card')}
                      className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMode === 'Card'
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-md scale-[1.01]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 shrink-0 text-emerald-400" /> Debit / Credit Card
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('Net Banking')}
                      className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMode === 'Net Banking'
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-md scale-[1.01]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4 shrink-0 text-emerald-400" /> Net Banking
                    </button>
                  </div>
                </div>

                {paymentMode === 'UPI (QR Code)' && (
                  <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center gap-3.5 border border-slate-800 shadow-sm">
                    <div className="w-14 h-14 bg-white p-1 rounded-xl shrink-0 flex items-center justify-center shadow-inner">
                      <QrCode className="w-11 h-11 text-slate-900" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-emerald-400 block tracking-wider">Scan Hospital UPI QR Code</span>
                      <p className="text-xs font-mono font-bold tracking-wide text-white">skmh.hospital@okhdfcbank</p>
                      <p className="text-[10px] text-slate-400 font-medium">Google Pay • PhonePe • Paytm • BHIM</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">UPI Ref / Transaction Number</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/629103910293 or Card Approval No"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl space-y-4 flex flex-col justify-between shadow-xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Bill Calculation Summary</h4>
                  
                  <div className="space-y-3 mt-4 text-xs">
                    <div className="flex justify-between items-center text-slate-300 font-semibold">
                      <span>Subtotal Charges:</span>
                      <span className="font-bold text-white text-sm">₹{subtotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-semibold">Discount Concession (₹):</span>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="w-24 p-1.5 text-right bg-slate-800 text-emerald-300 rounded-xl border border-slate-700 font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-400 text-xs"
                      />
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-400">Total Net Amount Payable:</span>
                      <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">₹{totalPaid.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleGenerateReceipt}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 active:scale-95"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0" /> Confirm Payment & Produce Bill PDF
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* GENERATED MONEY RECEIPT (PRINTABLE FORMAT) */
          <div className="space-y-6 animate-in fade-in">
            
            <div className="bg-emerald-50/90 border-2 border-emerald-300 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-emerald-950 text-xs font-bold print:hidden shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider shadow">
                  <CheckCircle2 className="w-4 h-4" /> Paid & Confirmed
                </span>
                <div>
                  <span className="text-slate-600 font-bold block text-[10px] uppercase">Paid Method & Ref ID:</span>
                  <span className="font-extrabold text-emerald-900 text-xs sm:text-sm">
                    {receiptGenerated.payment_mode} • Ref: <span className="font-mono">{receiptGenerated.transaction_ref || 'PAID-DESK-01'}</span>
                  </span>
                </div>
              </div>

              <div className="text-right font-mono text-emerald-800">
                <span className="text-[10px] text-slate-500 font-sans block uppercase font-bold">Receipt No:</span>
                <span className="font-extrabold text-xs sm:text-sm">{receiptGenerated.receipt_number}</span>
              </div>
            </div>

            {/* Printable Slip Canvas */}
            <div className="border-2 border-slate-900 p-6 rounded-2xl space-y-4 bg-white text-slate-900 font-sans">
              
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">SHREE KRISHNA MULTISPECIALITY HOSPITAL</h1>
                  <p className="text-xs font-bold text-slate-700">Opp. Horizon tower, Kilvani Road, Mitu Apartment, C/o - Gulabbhai Patel, Amli, Silvassa - 396230 (UT)</p>
                  <p className="text-[11px] font-medium text-slate-600">Ph: (0260) 264-9999 • Email: shreekrishnamultispeciality.sil@gmail.com</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider">
                    Official Payment Receipt
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">{receiptGenerated.receipt_number}</p>
                  <p className="text-[10px] text-slate-600">Date: {receiptGenerated.payment_date}</p>
                </div>
              </div>

              {/* Patient & Payment Details */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-3">
                <div>
                  <p><strong>Patient Name:</strong> {receiptGenerated.patient_name}</p>
                  <p><strong>Patient UHID Code:</strong> {receiptGenerated.patient_code}</p>
                  <p><strong>Contact Phone:</strong> {receiptGenerated.phone}</p>
                </div>
                <div>
                  <p><strong>Payment Mode:</strong> <span className="font-bold">{receiptGenerated.payment_mode}</span></p>
                  <p><strong>Ref / Transaction ID:</strong> <span className="font-mono">{receiptGenerated.transaction_ref}</span></p>
                  <p><strong>Billed By:</strong> {receiptGenerated.collected_by}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 font-extrabold text-slate-900 bg-slate-100">
                    <th className="p-2">#</th>
                    <th className="p-2">Particulars / Service Rendered</th>
                    <th className="p-2">Category</th>
                    <th className="p-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {receiptGenerated.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-mono">{idx + 1}</td>
                      <td className="p-2 font-bold">{it.description}</td>
                      <td className="p-2 text-slate-600">{it.category}</td>
                      <td className="p-2 text-right font-bold">₹{it.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Total */}
              <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 italic">* Computer generated receipt. Valid with digital hospital seal.</p>
                </div>
                <div className="text-right space-y-1">
                  <p>Subtotal: <strong>₹{receiptGenerated.subtotal.toLocaleString()}</strong></p>
                  {receiptGenerated.discount > 0 && <p className="text-rose-600">Discount Concession: <strong>-₹{receiptGenerated.discount.toLocaleString()}</strong></p>}
                  <p className="text-base font-black text-slate-900 border-t border-slate-900 pt-1">
                    Total Amount Paid: ₹{receiptGenerated.total_paid.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Official Seal and Stamp */}
              {stampConfig && (
                <div className="pt-6 flex justify-between items-end text-xs">
                  <div>
                    <img src={stampConfig.stamp_url} alt="Hospital Seal" className="w-20 h-20 object-contain opacity-80" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Hospital Official Stamp</span>
                  </div>

                  <div className="text-right">
                    <img src={stampConfig.signature_url} alt="Doctor Signature" className="h-10 object-contain inline-block mb-1" />
                    <p className="font-extrabold text-slate-900">{stampConfig.authorized_doctor_name}</p>
                    <p className="text-[10px] text-slate-600">{stampConfig.designation}</p>
                    <p className="text-[9px] font-mono text-slate-500">{stampConfig.registration_number}</p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 print:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (receiptGenerated) {
                      if (receiptGenerated.items && receiptGenerated.items.length > 0) {
                        setLineItems(receiptGenerated.items);
                      }
                      if (receiptGenerated.payment_mode) {
                        setPaymentMode(receiptGenerated.payment_mode as any);
                      }
                      if (receiptGenerated.transaction_ref) {
                        setTransactionRef(receiptGenerated.transaction_ref);
                      }
                      if (receiptGenerated.discount) {
                        setDiscount(receiptGenerated.discount);
                      }
                    }
                    setReceiptGenerated(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Add More Service Rendered / Edit Bill
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLineItems([
                      {
                        description: doctorName ? `OPD Consultation Fee - Dr. ${doctorName}` : 'Senior OPD Doctor Consultation Charge',
                        category: 'Consultation',
                        amount: 500
                      }
                    ]);
                    setTransactionRef('');
                    setDiscount(0);
                    setReceiptGenerated(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <FileText className="w-4 h-4 text-slate-500" /> New Blank Bill
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Printer className="w-4 h-4 text-emerald-400" /> Print / Save PDF Receipt
              </button>
            </div>

          </div>
        )}

        </div>
      </div>
    </div>
  );
};
