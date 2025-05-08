
/**
 * Simple encryption utility for storing sensitive data in localStorage
 * 
 * Note: This is not meant for high-security applications. It provides
 * basic obfuscation to prevent casual inspection of localStorage.
 */

// A simple encryption key derived from the browser's user agent
const getEncryptionKey = (): string => {
  const userAgent = navigator.userAgent;
  let key = 0;
  for (let i = 0; i < userAgent.length; i++) {
    key += userAgent.charCodeAt(i);
  }
  return key.toString(16);
};

export const encrypt = (text: string): string => {
  if (!text) return '';
  
  const key = getEncryptionKey();
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  
  return btoa(result);
};

export const decrypt = (encrypted: string): string => {
  if (!encrypted) return '';
  
  try {
    const key = getEncryptionKey();
    const text = atob(encrypted);
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    
    return result;
  } catch (error) {
    console.error('Failed to decrypt:', error);
    return '';
  }
};
