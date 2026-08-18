import QRCode from "qrcode";

export async function qrToDataUrl(qrData: string): Promise<string> {
  return QRCode.toDataURL(qrData, {
    margin: 1,
    width: 300,
    errorCorrectionLevel: "M",
  });
}

export async function qrToPngBuffer(qrData: string): Promise<Buffer> {
  return QRCode.toBuffer(qrData, {
    margin: 1,
    width: 500,
    errorCorrectionLevel: "M",
  });
}
