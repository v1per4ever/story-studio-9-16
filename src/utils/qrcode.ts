import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  if (!text || text.trim() === '') {
    return '';
  }
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (error) {
    console.error('QR code generation failed:', error);
    return '';
  }
}
