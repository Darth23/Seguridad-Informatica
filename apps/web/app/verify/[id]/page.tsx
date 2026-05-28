'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface VerificationResult {
  isValid: boolean;
  certificateId: string;
  recipientName?: string;
  courseName?: string;
  issuedDate?: string;
}

export default function VerifyPage() {
  const params = useParams();
  const certId = params.id as string;
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!certId) return;

    const stored = localStorage.getItem(`cert_${certId}`);
    if (stored) {
      try {
        const cert = JSON.parse(stored);
        setResult({
          isValid: true,
          certificateId: cert.certificateId || certId,
          recipientName: cert.userName,
          courseName: cert.courseName,
          issuedDate: cert.completionDate,
        });
      } catch {
        setResult({ isValid: false, certificateId: certId });
      }
    } else {
      setResult({ isValid: false, certificateId: certId });
    }
    setLoading(false);
  }, [certId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-gray-400">Verificando certificado...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-xl border border-gray-700 p-8 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">
          {result?.isValid ? '✅' : '❌'}
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {result?.isValid ? 'Certificado Válido' : 'Certificado No Válido'}
        </h1>
        <p className="text-gray-400 mb-6">
          {result?.isValid
            ? 'Este certificado ha sido verificado exitosamente.'
            : 'Este certificado no fue encontrado en el sistema.'}
        </p>

        {result?.isValid && (
          <div className="bg-gray-800/50 rounded-lg p-4 text-left space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">ID:</span>
              <span className="text-white font-mono">{result.certificateId}</span>
            </div>
            {result.recipientName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Nombre:</span>
                <span className="text-white">{result.recipientName}</span>
              </div>
            )}
            {result.courseName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Curso:</span>
                <span className="text-white">{result.courseName}</span>
              </div>
            )}
            {result.issuedDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fecha:</span>
                <span className="text-white">
                  {new Date(result.issuedDate).toLocaleDateString('es-ES')}
                </span>
              </div>
            )}
          </div>
        )}

        <a
          href="/"
          className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Volver a CyberEdu
        </a>
      </div>
    </div>
  );
}
