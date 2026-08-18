import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/session";
import { formatLKR, formatDate } from "@/lib/utils";
import { InvoiceStatus } from "@/lib/constants";
import { Card } from "@/components/ui";

export default async function InvoicesPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/login");

  const invoices = await prisma.invoice.findMany({
    where: { studentId: student.id },
    include: {
      classPeriod: true,
      session: true,
      items: true,
      payments: {
        orderBy: { initiatedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card>
      <h2 className="text-xl font-semibold text-slate-900">Payment History</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-medium">Month</th>
              <th className="py-2 font-medium">Session</th>
              <th className="py-2 font-medium">Subjects</th>
              <th className="py-2 font-medium">Amount</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  No payments yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const payment = inv.payments[0];
                const isPaid = inv.status === InvoiceStatus.PAID;
                return (
                  <tr key={inv.id} className="border-b border-slate-100">
                    <td className="py-3">{inv.classPeriod.displayName}</td>
                    <td className="py-3">{inv.session.name}</td>
                    <td className="py-3">
                      {inv.items.map((i) => i.subjectName).join(", ")}
                    </td>
                    <td className="py-3">{formatLKR(inv.totalAmount)}</td>
                    <td className="py-3">
                      <span
                        className={
                          isPaid
                            ? "font-medium text-emerald-600"
                            : "font-medium text-amber-600"
                        }
                      >
                        {isPaid ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="py-3">
                      {isPaid && payment ? (
                        <Link
                          href={`/api/receipts/${payment.id}/pdf`}
                          className="text-indigo-600 hover:underline"
                        >
                          Receipt
                        </Link>
                      ) : (
                        <Link
                          href={`/student/payment?invoiceId=${inv.id}`}
                          className="text-indigo-600 hover:underline"
                        >
                          Pay
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Today: {formatDate(new Date())}
      </p>
    </Card>
  );
}
