'use client';

interface FeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData?: {
    receiptNo: string;
    studentName: string;
    rollno: string;
    amountPaid: string;
    paymentDate: string;
    paymentMode: string;
  };
}

export default function FeeReceiptModal({ isOpen, onClose, receiptData }: FeeReceiptModalProps) {
  if (!isOpen) return null;

  const data = receiptData || {
    receiptNo: 'REC-2026-009182',
    studentName: 'Rahul Verma',
    rollno: 'MBBS2023045',
    amountPaid: '₹150,000.00',
    paymentDate: new Date().toLocaleDateString(),
    paymentMode: 'ONLINE (Razorpay / Gateway)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-6 text-slate-100 shadow-2xl">
        <div className="text-center border-b border-slate-800 pb-4 space-y-1">
          <div className="w-10 h-10 mx-auto rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg">
            M
          </div>
          <h3 className="text-base font-extrabold text-white">SRMS Medical University</h3>
          <p className="text-xs text-slate-400">Official Student Fee Payment Receipt</p>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Receipt No:</span>
            <span className="font-mono font-bold text-indigo-400">{data.receiptNo}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Student Name:</span>
            <span className="font-semibold text-white">{data.studentName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Roll Number:</span>
            <span className="font-semibold text-slate-300">{data.rollno}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Payment Date:</span>
            <span className="font-semibold text-slate-300">{data.paymentDate}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Payment Mode:</span>
            <span className="font-semibold text-emerald-400">{data.paymentMode}</span>
          </div>
          <div className="flex justify-between py-2 bg-slate-800/80 px-3 rounded-lg text-sm">
            <span className="font-bold text-slate-300">Amount Paid:</span>
            <span className="font-extrabold text-emerald-400">{data.amountPaid}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow"
          >
            🖨 Print / Download PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
