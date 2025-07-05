export const isExternalUrl = (url: string): boolean => {
  // Normalize URL for case-insensitive comparison
  const normalizedUrl = url.toLowerCase().trim();
  
  // Check for dangerous protocols first
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
  if (dangerousProtocols.some(protocol => normalizedUrl.startsWith(protocol))) {
    console.warn(`Blocked navigation to dangerous URL: ${url}`);
    return true; // Treat as external to prevent router handling
  }
  
  // Check for external protocols
  const externalProtocols = [
    'http://',
    'https://',
    '//', // Protocol-relative
    'ftp://',
    'ftps://',
    'mailto:',
    'tel:',
    'sms:',
    'file:',
    'blob:'
  ];
  
  return externalProtocols.some(protocol => normalizedUrl.startsWith(protocol));
};

export const isSafeUrl = (url: string): boolean => {
  const normalizedUrl = url.toLowerCase().trim();
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
  return !dangerousProtocols.some(protocol => normalizedUrl.startsWith(protocol));
};