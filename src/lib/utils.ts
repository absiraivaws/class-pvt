import { prisma } from "@/lib/prisma";

export function formatLKR(amount: number | string | { toNumber(): number }): string {
  const n =
    typeof amount === "number"
      ? amount
      : typeof amount === "string"
        ? Number(amount)
        : amount.toNumber();
  return `Rs. ${n.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

async function nextInvoiceSequence(year: number): Promise<number> {
  const prefix = `INV-${year}-`;
  const records = await prisma.invoice.findMany({
    where: { invoiceNumber: { startsWith: prefix } },
    select: { invoiceNumber: true },
  });
  let max = 0;
  for (const r of records) {
    const match = r.invoiceNumber.match(/(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return max + 1;
}

async function nextPaymentSequence(year: number): Promise<number> {
  const prefix = `PAY-${year}`;
  const records = await prisma.payment.findMany({
    where: { reference: { startsWith: prefix } },
    select: { reference: true },
  });
  let max = 0;
  for (const r of records) {
    const match = r.reference.match(/(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return max + 1;
}

async function nextReceiptSequence(year: number): Promise<number> {
  const prefix = `RCT-${year}-`;
  const records = await prisma.payment.findMany({
    where: { receiptNumber: { startsWith: prefix } },
    select: { receiptNumber: true },
  });
  let max = 0;
  for (const r of records) {
    if (!r.receiptNumber) continue;
    const match = r.receiptNumber.match(/(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return max + 1;
}

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextInvoiceSequence(year);
  return `INV-${year}-${pad(seq, 8)}`;
}

export async function generatePaymentReference(): Promise<string> {
  const now = new Date();
  const ymd = `${now.getFullYear()}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}`;
  const seq = await nextPaymentSequence(now.getFullYear());
  return `PAY-${ymd}-${pad(seq, 8)}`;
}

export async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await nextReceiptSequence(year);
  return `RCT-${year}-${pad(seq, 8)}`;
}
