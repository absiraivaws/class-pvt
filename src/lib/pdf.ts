import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { qrToPngBuffer } from "@/lib/qr";
import { formatLKR } from "@/lib/utils";

const PAGE_WIDTH = 595.28; // A4 width in points
const MARGIN = 50;
const LINE_HEIGHT = 16;

export type ReceiptData = {
  receiptNumber: string;
  invoiceNumber: string;
  sid: string;
  studentName: string;
  nic: string;
  stream: string;
  phone: string;
  email: string;
  period: string;
  session: string;
  items: { subjectName: string; amount: number }[];
  total: number;
  paymentMethod: string;
  providerTxnId: string;
  reference: string;
  paidAt: Date;
  instituteName: string;
};

export async function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([PAGE_WIDTH, 842]);
  let y = 800;

  const center = (text: string, size: number, f = bold) => {
    const width = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (PAGE_WIDTH - width) / 2, y, size, font: f });
    y -= size + 8;
  };

  const line = (text: string, size = 10, f = font, indent = 0) => {
    page.drawText(text, { x: MARGIN + indent, y, size, font: f });
    y -= LINE_HEIGHT;
  };

  center("PAYMENT RECEIPT", 18);
  center(data.instituteName, 12, font);
  y -= 8;

  line(`Receipt No: ${data.receiptNumber}`, 10);
  line(`Invoice No: ${data.invoiceNumber}`, 10);
  line(`Date: ${data.paidAt.toLocaleString("en-GB")}`, 10);
  y -= 4;

  line("Student Details", 11, bold);
  line(`SID: ${data.sid}`, 10);
  line(`Name: ${data.studentName}`, 10);
  line(`NIC: ${data.nic}`, 10);
  line(`Stream: ${data.stream}`, 10);
  y -= 4;

  line("Class Details", 11, bold);
  line(`Month / Year: ${data.period}`, 10);
  line(`Session: ${data.session}`, 10);
  y -= 4;

  line("Subjects", 11, bold);
  for (const item of data.items) {
    page.drawText(item.subjectName, { x: MARGIN, y, size: 10, font });
    const amt = formatLKR(item.amount);
    const amtWidth = font.widthOfTextAtSize(amt, 10);
    page.drawText(amt, { x: PAGE_WIDTH - MARGIN - amtWidth, y, size: 10, font });
    y -= LINE_HEIGHT;
  }
  y -= 2;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  y -= LINE_HEIGHT;
  const totalText = `TOTAL  ${formatLKR(data.total)}`;
  const totalWidth = bold.widthOfTextAtSize(totalText, 11);
  page.drawText(totalText, { x: PAGE_WIDTH - MARGIN - totalWidth, y, size: 11, font: bold });
  y -= 20;

  line(`Payment Method: ${data.paymentMethod}`, 10);
  line(`Transaction Ref: ${data.providerTxnId}`, 10);
  line(`Reference: ${data.reference}`, 10);
  y -= 4;

  line("Status: PAID", 12, bold);

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export type QrPdfData = {
  invoiceNumber: string;
  sid: string;
  studentName: string;
  amount: number;
  qrData: string;
  expiry: Date;
  instituteName: string;
};

export async function generateQrPdf(data: QrPdfData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([PAGE_WIDTH, 842]);
  let y = 800;

  const center = (text: string, size: number, f = bold) => {
    const width = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (PAGE_WIDTH - width) / 2, y, size, font: f });
    y -= size + 8;
  };

  center("PAY YOUR CLASS FEE", 16);
  center(data.instituteName, 11, font);
  y -= 12;

  const line = (text: string, size = 11) => {
    page.drawText(text, { x: MARGIN, y, size, font });
    y -= LINE_HEIGHT + 4;
  };

  line(`Invoice: ${data.invoiceNumber}`);
  line(`Student: ${data.studentName}`);
  line(`SID: ${data.sid}`);
  line(`Amount: ${formatLKR(data.amount)}`);
  line(`QR Expiry: ${data.expiry.toLocaleString("en-GB")}`);
  y -= 12;

  const qrPng = await qrToPngBuffer(data.qrData);
  const image = await doc.embedPng(qrPng);
  const size = 220;
  page.drawImage(image, {
    x: (PAGE_WIDTH - size) / 2,
    y: y - size,
    width: size,
    height: size,
  });
  y -= size + 20;

  center(
    "Scan using a supported banking/payment application to complete your payment.",
    9,
    font
  );

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
