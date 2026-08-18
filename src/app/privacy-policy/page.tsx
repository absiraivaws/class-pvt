import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-sm text-slate-600">
        <p>
          We collect personal information (name, NIC, contact details, and
          academic stream) solely to manage student registration and class-fee
          payments.
        </p>
        <p>
          Payment information is processed by the connected payment provider.
          We do not store your card or banking credentials on our servers.
        </p>
        <p>
          Your data is protected with encryption in transit and access is
          restricted to authorised staff.
        </p>
      </div>
      <Link href="/" className="mt-6 inline-block text-indigo-600 hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}
