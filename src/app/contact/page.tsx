import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Contact</h1>
      <p className="mt-4 text-slate-600">
        For questions about class fees or payments, contact the institute
        administration office.
      </p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
        <p>Institute: Private Class Institute</p>
        <p>Email: admin@example.com</p>
        <p>Phone: 077 000 0000</p>
      </div>
      <Link href="/" className="mt-6 inline-block text-indigo-600 hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}
