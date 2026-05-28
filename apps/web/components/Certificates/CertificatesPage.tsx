'use client';

import React, { useState, useEffect } from 'react';
import {
  downloadCertificate,
  verifyCertificate,
  storeCertificateForVerification,
  getAllStoredCertificates,
  generateCertificateId,
  generateSignature,
  type CertificateData,
} from '../../lib/certificates/certificateEngine';
import { certificateSigner } from '../../lib/certificates/certificateSigner';

interface CertificatesPageProps {
  userName?: string;
  userId?: string;
}

export function CertificatesPage({
  userName = 'Estudiante',
  userId = 'user-001',
}: CertificatesPageProps): JSX.Element {
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    id: string;
    isValid: boolean;
    message: string;
  } | null>(null);
  const [verifyInput, setVerifyInput] = useState('');

  // Cargar certificados al montar
  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = () => {
    const stored = getAllStoredCertificates();
    setCertificates(stored);
  };

  const handleGenerateCertificate = async () => {
    setIsGenerating(true);
    try {
      const certificateId = generateCertificateId();
      
      // Datos simulados del certificado (en producción obtener de analytics/userState)
      const certData: CertificateData = {
        userId,
        userName,
        completionDate: new Date(),
        courseName: 'Zero-Trust Security Program',
        totalHours: 42,
        lessonsCompleted: 14,
        flagsCaptured: 28,
        score: 95,
        certificateId,
        signature: '',
      };

      // Generar firma
      certData.signature = await generateSignature(certData);

      // Firmar con Web Crypto API
      await certificateSigner.initialize();
      const signedCert = await certificateSigner.sign(certData);

      // Guardar para verificación futura
      storeCertificateForVerification(signedCert);

      // Descargar PDF
      await downloadCertificate(signedCert);

      // Actualizar lista
      loadCertificates();

      setVerificationResult({
        id: certificateId,
        isValid: true,
        message: 'Certificado generado y descargado exitosamente',
      });
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      setVerificationResult({
        id: '',
        isValid: false,
        message: 'Error al generar certificado',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyInput.trim()) return;

    try {
      const parts = verifyInput.split('-');
      const certId = parts[0];
      const signature = parts.slice(1).join('-');

      const result = await verifyCertificate(certId, signature || 'SIG-00000000');
      
      setVerificationResult({
        id: certId,
        isValid: result.isValid,
        message: result.isValid
          ? `Certificado válido para ${result.recipientName}`
          : 'Certificado inválido o no encontrado',
      });
    } catch (error) {
      setVerificationResult({
        id: verifyInput,
        isValid: false,
        message: 'Error al verificar certificado',
      });
    }
  };

  const handleDownloadExisting = async (cert: CertificateData) => {
    try {
      await downloadCertificate(cert);
    } catch (error) {
      console.error('Failed to download:', error);
    }
  };

  return (
    <div 
      className="p-6 bg-gray-900 rounded-lg border border-gray-700 shadow-xl"
      role="region"
      aria-label="Gestión de Certificados"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">🎓 Certificados</h1>
        <p className="text-gray-400">
          Genera y gestiona tus certificados de completación con verificación digital
        </p>
      </div>

      {/* Generar nuevo certificado */}
      <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Generar Certificado</h2>
        
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleGenerateCertificate}
            disabled={isGenerating}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-busy={isGenerating}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando...
              </span>
            ) : (
              '📜 Generar Nuevo Certificado'
            )}
          </button>

          <div className="text-sm text-gray-400">
            <span className="text-green-400">✓</span> Firma digital RSA-2048
            <span className="mx-3">|</span>
            <span className="text-green-400">✓</span> QR de verificación
            <span className="mx-3">|</span>
            <span className="text-green-400">✓</span> PDF descargable
          </div>
        </div>
      </div>

      {/* Verificar certificado */}
      <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Verificar Certificado</h2>
        
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            value={verifyInput}
            onChange={(e) => setVerifyInput(e.target.value)}
            placeholder="Ingrese ID del certificado (CERT-XXXXX)"
            className="flex-1 min-w-[200px] px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="ID del certificado a verificar"
          />
          
          <button
            onClick={handleVerify}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            🔍 Verificar
          </button>
        </div>

        {verificationResult && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              verificationResult.isValid
                ? 'bg-green-900/30 border border-green-700'
                : 'bg-red-900/30 border border-red-700'
            }`}
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">
                {verificationResult.isValid ? '✅' : '❌'}
              </span>
              <div>
                <div className="font-semibold text-white">
                  {verificationResult.isValid ? 'Certificado Válido' : 'Certificado Inválido'}
                </div>
                <div className="text-sm text-gray-400">{verificationResult.message}</div>
                {verificationResult.id && (
                  <div className="text-xs text-gray-500 mt-1 font-mono">
                    ID: {verificationResult.id}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de certificados */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Mis Certificados ({certificates.length})
        </h2>

        {certificates.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2" aria-hidden="true">📜</div>
            <p>No tienes certificados generados aún</p>
            <p className="text-sm">Completa el curso para obtener tu certificado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <div
                key={cert.certificateId}
                className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600"
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="font-semibold text-white">{cert.courseName}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(cert.completionDate).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    {cert.certificateId}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="text-right text-sm text-gray-400 mr-4">
                    <div>{cert.lessonsCompleted} lecciones</div>
                    <div>{cert.totalHours} horas</div>
                    <div className="text-green-400">{cert.score}% score</div>
                  </div>

                  <button
                    onClick={() => handleDownloadExisting(cert)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Descargar certificado ${cert.certificateId}`}
                  >
                    📥 Descargar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Información de verificación */}
      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-300 mb-2">
          ℹ️ ¿Cómo funciona la verificación?
        </h3>
        <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
          <li>Cada certificado tiene una firma digital única generada con RSA-2048</li>
          <li>El código QR en el certificado contiene la URL de verificación</li>
          <li>Los datos se almacenan localmente en tu navegador</li>
          <li>Puedes compartir el ID de tu certificado para que otros lo verifiquen</li>
        </ul>
      </div>
    </div>
  );
}

export default CertificatesPage;
