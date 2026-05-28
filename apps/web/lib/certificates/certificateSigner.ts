/**
 * Certificate Signer - Firma y verificación de certificados
 * Implementa firma digital usando Web Crypto API
 */

import { type CertificateData } from './certificateEngine';

export interface SignedCertificate extends CertificateData {
  signature: string;
  signedAt: number;
  algorithm: string;
}

/**
 * Clase para gestionar firmas de certificados
 */
export class CertificateSigner {
  private keyPair: CryptoKeyPair | null = null;
  private readonly STORAGE_KEY = 'certificate_signing_key';

  /**
   * Inicializar o generar par de claves
   */
  async initialize(): Promise<void> {
    // Intentar cargar clave existente
    const stored = localStorage.getItem(this.STORAGE_KEY);
    
    if (stored) {
      try {
        const keyData = JSON.parse(stored);
        this.keyPair = await this.importKeyPair(keyData);
        return;
      } catch (e) {
        console.warn('Failed to load existing key, generating new one');
      }
    }

    // Generar nuevo par de claves
    await this.generateKeyPair();
  }

  /**
   * Generar par de claves RSA-2048
   */
  private async generateKeyPair(): Promise<void> {
    this.keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    );

    // Exportar y guardar clave privada (en producción usar almacenamiento seguro)
    const exportedPrivate = await window.crypto.subtle.exportKey(
      'jwk',
      this.keyPair.privateKey
    );
    const exportedPublic = await window.crypto.subtle.exportKey(
      'jwk',
      this.keyPair.publicKey
    );

    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify({
        privateKey: exportedPrivate,
        publicKey: exportedPublic,
      })
    );
  }

  /**
   * Importar par de claves desde almacenamiento
   */
  private async importKeyPair(keyData: {
    privateKey: JsonWebKey;
    publicKey: JsonWebKey;
  }): Promise<CryptoKeyPair> {
    const privateKey = await window.crypto.subtle.importKey(
      'jwk',
      keyData.privateKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      true,
      ['sign']
    );

    const publicKey = await window.crypto.subtle.importKey(
      'jwk',
      keyData.publicKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      true,
      ['verify']
    );

    return { privateKey, publicKey };
  }

  /**
   * Firmar un certificado
   */
  async sign(certificate: CertificateData): Promise<SignedCertificate> {
    if (!this.keyPair) {
      await this.initialize();
    }

    // Crear payload para firmar
    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        id: certificate.certificateId,
        user: certificate.userId,
        course: certificate.courseName,
        date: certificate.completionDate.toISOString(),
        score: certificate.score,
      })
    );

    // Firmar datos
    const signature = await window.crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      this.keyPair!.privateKey,
      data
    );

    // Convertir firma a base64
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    return {
      ...certificate,
      signature: `RSA2048-${signatureBase64}`,
      signedAt: Date.now(),
      algorithm: 'RSASSA-PKCS1-v1_5',
    };
  }

  /**
   * Verificar firma de certificado
   */
  async verify(signedCert: SignedCertificate): Promise<boolean> {
    if (!this.keyPair) {
      await this.initialize();
    }

    try {
      // Extraer firma base64
      const signatureBase64 = signedCert.signature.replace('RSA2048-', '');
      const signature = Uint8Array.from(atob(signatureBase64), (c) => c.charCodeAt(0));

      // Recrear payload original
      const encoder = new TextEncoder();
      const data = encoder.encode(
        JSON.stringify({
          id: signedCert.certificateId,
          user: signedCert.userId,
          course: signedCert.courseName,
          date: signedCert.completionDate.toISOString(),
          score: signedCert.score,
        })
      );

      // Verificar firma
      const isValid = await window.crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        this.keyPair!.publicKey,
        signature,
        data
      );

      return isValid;
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    }
  }

  /**
   * Obtener huella de la clave pública (para identificación)
   */
  async getPublicKeyFingerprint(): Promise<string> {
    if (!this.keyPair) {
      await this.initialize();
    }

    const exported = await window.crypto.subtle.exportKey(
      'spki',
      this.keyPair!.publicKey
    );

    // Crear hash SHA-256 de la clave pública
    const hashBuffer = await window.crypto.subtle.digest(
      'SHA-256',
      exported
    );

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return hashHex.substring(0, 16).toUpperCase();
  }

  /**
   * Resetear claves (para testing o recuperación)
   */
  reset(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.keyPair = null;
  }
}

// Singleton instance
export const certificateSigner = new CertificateSigner();

/**
 * Hook helper para usar en componentes React
 */
export function useCertificateSigner() {
  return certificateSigner;
}

export default CertificateSigner;
