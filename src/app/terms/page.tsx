import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Terms &amp; Conditions</h1>
      <div className="mt-6 space-y-4 text-sm text-slate-600">
        <p>
          By registering, you agree to provide accurate information and to use
          this platform to pay your class fees.
        </p>
        <p>
          Generating a QR code does not confirm payment. An invoice is marked
          as paid only after the payment provider confirms the transaction.
        </p>
        <p>
          Fees for each subject, month, and session are set by the institute and
          are displayed at the time of selection.
        </p>
      </div>
      <Link href="/" className="mt-6 inline-block text-indigo-600 hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}
