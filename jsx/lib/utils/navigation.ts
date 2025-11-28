export const isExternalUrl = (url: string): boolean => {
  const normalizedUrl = url.toLowerCase().trim();

  const dangerousProtocols = ["javascript:", "data:", "vbscript:"];
  if (
    dangerousProtocols.some((protocol) => normalizedUrl.startsWith(protocol))
  ) {
    return true;
  }

  const externalProtocols = [
    "http://",
    "https://",
    "//",
    "ftp://",
    "ftps://",
    "mailto:",
    "tel:",
    "sms:",
    "file:",
    "blob:",
  ];

  return externalProtocols.some((protocol) =>
    normalizedUrl.startsWith(protocol),
  );
};

export const isSafeUrl = (url: string): boolean => {
  const normalizedUrl = url.toLowerCase().trim();
  const dangerousProtocols = ["javascript:", "data:", "vbscript:"];
  return !dangerousProtocols.some((protocol) =>
    normalizedUrl.startsWith(protocol),
  );
};
