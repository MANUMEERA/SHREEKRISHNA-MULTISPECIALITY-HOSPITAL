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
  onPaymentSuccess
}) => {
  if (!isOpen) return null;

  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI (QR Code)' | 'Card' | 'Net Banking'>('UPI (QR Code)');
  const [transactionRef, setTransactionRef] = useState('');
  const [stampConfig, setStampConfig] = useState<HospitalStampConfig | null>(null);

  const [availableCharges, setAvailableCharges] = useState<HospitalChargeCategory[]>([]);
  
  const [lineItems, setLineItems] = useState<{ description: string; category: string; amount: number }[]>([
    {
      description: doctorName ? `OPD Consultation Fee - ${doctorName}` : 'Senior OPD Doctor Consultation Charge',
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
  }, []);

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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 print:shadow-none print:m-0 print:w-full print:max-w-none print:p-4 border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:pb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md print:hidden">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                SHREE KRISHNA MULTISPECIALTY HOSPITAL
              </h2>
              <p className="text-xs text-slate-600 font-bold">
                Official OPD & Clinical Payment Money Receipt • Silvassa (D&NH)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            {receiptGenerated && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" /> Print / Save PDF
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

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
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase text-emerald-900">Add Standard Charge Master</label>
                  <div className="flex gap-2">
                    <select
                      value={newChargeId}
                      onChange={(e) => setNewChargeId(e.target.value)}
                      className="flex-1 p-2 rounded-xl border border-emerald-200 text-xs bg-white font-medium"
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
                      className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>

                {/* Custom Item */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-700">Add Custom Charges</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Dressing / Nebulization"
                      value={customItemDesc}
                      onChange={(e) => setCustomItemDesc(e.target.value)}
                      className="flex-1 p-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                    />
                    <input
                      type="number"
                      placeholder="Amount ₹"
                      value={customItemAmount}
                      onChange={(e) => setCustomItemAmount(e.target.value)}
                      className="w-20 p-2 rounded-xl border border-slate-200 text-xs bg-white font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCharge}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 shadow cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Payment Method Selector & Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-800">Select Payment Mode *</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI (QR Code)')}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                      paymentMode === 'UPI (QR Code)'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-md scale-102'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4" /> UPI (QR Code)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('Cash')}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                      paymentMode === 'Cash'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-md scale-102'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" /> Cash Counter
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('Card')}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                      paymentMode === 'Card'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-md scale-102'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Debit / Credit Card
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('Net Banking')}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                      paymentMode === 'Net Banking'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-md scale-102'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4" /> Net Banking
                  </button>
                </div>

                {paymentMode === 'UPI (QR Code)' && (
                  <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center gap-3">
                    <div className="w-16 h-16 bg-white p-1 rounded-xl shrink-0 flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-slate-900" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-400 block">Scan Hospital UPI QR Code</span>
                      <p className="text-xs font-mono font-bold">skmh.hospital@okhdfcbank</p>
                      <p className="text-[10px] text-slate-300">Google Pay • PhonePe • Paytm • BHIM</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">UPI Ref / Transaction Number</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/629103910293 or Card Approval No"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-3 flex flex-col justify-between shadow-xl">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-400">Bill Calculation Summary</h4>
                  
                  <div className="space-y-2 mt-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Subtotal Charges:</span>
                      <span className="font-bold">₹{subtotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Discount Concession (₹):</span>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="w-20 p-1 text-right bg-slate-800 text-emerald-300 rounded border border-slate-700 font-bold"
                      />
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                      <span className="text-sm font-extrabold text-emerald-400">Total Net Amount Payable:</span>
                      <span className="text-2xl font-black text-white">₹{totalPaid.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleGenerateReceipt}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  <CheckCircle2 className="w-5 h-5" /> Confirm Payment & Produce Bill PDF
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* GENERATED MONEY RECEIPT (PRINTABLE FORMAT) */
          <div className="space-y-6 animate-in fade-in">
            
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-emerald-900 text-xs font-bold print:hidden">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Payment successfully confirmed & recorded in hospital accounting ledger!
              </span>
              <span className="font-mono text-emerald-800">{receiptGenerated.receipt_number}</span>
            </div>

            {/* Printable Slip Canvas */}
            <div className="border-2 border-slate-900 p-6 rounded-2xl space-y-4 bg-white text-slate-900 font-sans">
              
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">SHREE KRISHNA MULTISPECIALTY HOSPITAL</h1>
                  <p className="text-xs font-bold text-slate-700">Opp. Horizon tower, Kilvani Road, Mitu Apartment, C/o - Gulabbhai Patel, Amli, Silvassa - 396230 (UT)</p>
                  <p className="text-[11px] font-medium text-slate-600">Ph: (0260) 264-9999 • Email: billing@shreekrishnahospital.org</p>
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
            <div className="flex justify-between items-center pt-4 print:hidden">
              <button
                type="button"
                onClick={() => setReceiptGenerated(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Create Another Bill
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF Receipt
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
