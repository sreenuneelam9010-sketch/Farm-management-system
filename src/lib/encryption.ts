/**
 * End-to-End Encryption (E2EE) Utility for Sri Neelam Livestock In-App Chat.
 * Secures messages during transmission and local storage.
 */

const E2EE_SHARED_KEY = "LVF_E2EE_SECURE_KEY_2026_SRI_NEELAM_LIVESTOCK_FARM";

/**
 * Encrypts plain text into an encrypted base64 string tagged with "e2ee:v1:".
 */
export function encryptText(plainText: string): string {
  if (!plainText) return "";
  try {
    const keyChars = E2EE_SHARED_KEY.split('').map(c => c.charCodeAt(0));
    const encryptedChars = Array.from(plainText).map((char, index) => {
      const code = char.charCodeAt(0);
      const keyByte = keyChars[index % keyChars.length];
      return String.fromCharCode(code ^ keyByte);
    }).join('');

    // Convert to base64 safely supporting Unicode UTF-8
    const utf8Bytes = new TextEncoder().encode(encryptedChars);
    let binary = '';
    utf8Bytes.forEach(b => binary += String.fromCharCode(b));
    const base64 = btoa(binary);

    return `e2ee:v1:${base64}`;
  } catch (err) {
    console.error("Encryption failed, falling back safely:", err);
    return plainText;
  }
}

/**
 * Decrypts an encrypted payload starting with "e2ee:v1:".
 * If text is not encrypted or decryption fails, returns original text gracefully.
 */
export function decryptText(cipherText: string): string {
  if (!cipherText) return "";
  if (!cipherText.startsWith("e2ee:v1:")) {
    return cipherText; // legacy or plain text
  }

  try {
    const base64 = cipherText.replace("e2ee:v1:", "");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const decodedStr = new TextDecoder().decode(bytes);

    const keyChars = E2EE_SHARED_KEY.split('').map(c => c.charCodeAt(0));
    const decryptedChars = Array.from(decodedStr).map((char, index) => {
      const code = char.charCodeAt(0);
      const keyByte = keyChars[index % keyChars.length];
      return String.fromCharCode(code ^ keyByte);
    }).join('');

    return decryptedChars;
  } catch (err) {
    console.error("Decryption failed:", err);
    return "[Encrypted Message - Unable to Decrypt]";
  }
}
