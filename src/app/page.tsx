import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="text-lg font-bold text-indigo-600">Class Pay</div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-6 px-4 py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Pay your class fees securely with a Dynamic QR
        </h1>
        <p className="max-w-xl text-lg text-slate-600">
          Register, select your classes and subjects, generate an invoice, and
          pay the exact amount using a unique QR code.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Register as a Student
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
          >
            Student Login
          </Link>
        </div>
        <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["Select Classes", "Choose month, session, and subjects."],
            ["Generate Invoice", "Automatic cumulative total."],
            ["Pay & Download", "Dynamic QR + instant receipt."],
          ].map(([title, desc]) => (
            <div
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm"
            >
              <div className="font-semibold text-slate-900">{title}</div>
              <div className="mt-1 text-sm text-slate-500">{desc}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4">
          <Link href="/contact" className="hover:text-slate-700">
            Contact
          </Link>
          <Link href="/privacy-policy" className="hover:text-slate-700">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-700">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
