/**
 * Certificate Engine - Generación de certificados PDF
 * Usa jsPDF para crear certificados con QR, firma digital y verificación
 */

import jsPDF from 'jspdf';
import type { UserState } from '@cyber-edu/types';

export interface CertificateData {
  userId: string;
  userName: string;
  completionDate: Date;
  courseName: string;
  totalHours: number;
  lessonsCompleted: number;
  flagsCaptured: number;
  score: number;
  certificateId: string;
  signature: string;
}

export interface CertificateVerification {
  isValid: boolean;
  certificateId: string;
  issuedDate: string;
  recipientName: string;
  courseName: string;
  verificationUrl: string;
}

/**
 * Generar ID único para certificado
 */
export function generateCertificateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `CERT-${timestamp}-${randomPart}`.toUpperCase();
}

/**
 * Generar firma digital (SHA-256 simulado)
 * En producción usar Web Crypto API real
 */
export async function generateSignature(data: CertificateData): Promise<string> {
  const payload = JSON.stringify({
    id: data.certificateId,
    user: data.userId,
    date: data.completionDate.toISOString(),
    course: data.courseName,
  });

  // Simulación de hash SHA-256
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `SIG-${Math.abs(hash).toString(16).padStart(8, '0').toUpperCase()}`;
}

/**
 * Generar código QR como canvas (simulado)
 * En producción usar una librería como qrcode
 */
function generateQRCodeData(certificateId: string): string {
  // Retorna URL de verificación que contendría los datos del certificado
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/verify/${certificateId}`;
}

/**
 * Crear certificado PDF
 */
export async function createCertificate(data: CertificateData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Fondo decorativo
  doc.setFillColor(13, 17, 23); // #0d1117
  doc.rect(0, 0, width, height, 'F');

  // Borde decorativo
  doc.setDrawColor(59, 130, 246); // Blue-500
  doc.setLineWidth(2);
  doc.rect(10, 10, width - 20, height - 20);

  doc.setDrawColor(148, 163, 184); // Gray-400
  doc.setLineWidth(0.5);
  doc.rect(15, 15, width - 30, height - 30);

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(59, 130, 246);
  doc.text('CERTIFICADO DE COMPLECIÓN', width / 2, 40, { align: 'center' });

  // Subtítulo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(156, 163, 175);
  doc.text('CyberEdu Academy - Zero-Trust Security Program', width / 2, 50, { align: 'center' });

  // Nombre del estudiante
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text(data.userName, width / 2, 70, { align: 'center' });

  // Texto de certificación
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(209, 213, 219);
  const certText = 'Ha completado satisfactoriamente el programa de';
  doc.text(certText, width / 2, 85, { align: 'center' });

  // Nombre del curso
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(59, 130, 246);
  doc.text(data.courseName, width / 2, 95, { align: 'center' });

  // Estadísticas en grid
  const statsY = 115;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(209, 213, 219);

  const stats = [
    { label: 'Horas Totales', value: `${data.totalHours}h` },
    { label: 'Lecciones', value: data.lessonsCompleted.toString() },
    { label: 'Flags Capturadas', value: data.flagsCaptured.toString() },
    { label: 'Puntuación', value: `${data.score}%` },
  ];

  const statWidth = (width - 60) / stats.length;
  stats.forEach((stat, i) => {
    const x = 30 + i * statWidth;
    doc.setTextColor(148, 163, 175);
    doc.text(stat.label, x, statsY, { align: 'center' });
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, x, statsY + 7, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });

  // Fecha de emisión
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  const formattedDate = data.completionDate.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Fecha de Emisión: ${formattedDate}`, 30, height - 40);

  // ID del certificado
  doc.text(`ID: ${data.certificateId}`, width - 30, height - 40, { align: 'right' });

  // Firma digital
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Firma Digital: ${data.signature}`, 30, height - 30);

  // QR Code (placeholder - en producción generar QR real)
  const qrSize = 25;
  const qrX = width - 50;
  const qrY = height - 60;

  // Dibujar placeholder del QR
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX, qrY, qrSize, qrSize, 'F');
  doc.setFillColor(0, 0, 0);
  
  // Patrón simulado de QR
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (Math.random() > 0.5) {
        doc.rect(qrX + 3 + i * 4, qrY + 3 + j * 4, 3, 3, 'F');
      }
    }
  }

  // URL de verificación debajo del QR
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(59, 130, 246);
  const verifyUrl = generateQRCodeData(data.certificateId);
  const shortUrl = verifyUrl.replace(/^https?:\/\//, '').substring(0, 25) + '...';
  doc.text(shortUrl, qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' });

  // Sello de autenticidad
  doc.setDrawColor(16, 185, 129); // Green-500
  doc.setLineWidth(1.5);
  doc.circle(width - 30, 40, 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.text('VERIFICABLE', width - 30, 38, { align: 'center' });
  doc.text('ONLINE', width - 30, 43, { align: 'center' });

  // Guardar como blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

/**
 * Verificar certificado
 */
export async function verifyCertificate(
  certificateId: string,
  signature: string
): Promise<CertificateVerification> {
  // En producción, esto consultaría una base de datos o blockchain
  const stored = localStorage.getItem(`cert_${certificateId}`);
  
  if (!stored) {
    return {
      isValid: false,
      certificateId,
      issuedDate: '',
      recipientName: '',
      courseName: '',
      verificationUrl: generateQRCodeData(certificateId),
    };
  }

  try {
    const certData = JSON.parse(stored);
    
    // Verificar firma
    const expectedSignature = await generateSignature(certData);
    const isValid = expectedSignature === signature;

    return {
      isValid,
      certificateId,
      issuedDate: new Date(certData.completionDate).toLocaleDateString('es-ES'),
      recipientName: certData.userName,
      courseName: certData.courseName,
      verificationUrl: generateQRCodeData(certificateId),
    };
  } catch (error) {
    return {
      isValid: false,
      certificateId,
      issuedDate: '',
      recipientName: '',
      courseName: '',
      verificationUrl: generateQRCodeData(certificateId),
    };
  }
}

/**
 * Guardar certificado en localStorage para verificación futura
 */
export function storeCertificateForVerification(data: CertificateData): void {
  localStorage.setItem(`cert_${data.certificateId}`, JSON.stringify(data));
}

/**
 * Obtener todos los certificados almacenados
 */
export function getAllStoredCertificates(): CertificateData[] {
  const certificates: CertificateData[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('cert_')) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          certificates.push(JSON.parse(data));
        } catch (e) {
          console.warn('Failed to parse certificate:', key);
        }
      }
    }
  }
  
  return certificates;
}

/**
 * Descargar certificado
 */
export async function downloadCertificate(data: CertificateData, filename?: string): Promise<void> {
  const pdfBlob = await createCertificate(data);
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `certificado-${data.certificateId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
