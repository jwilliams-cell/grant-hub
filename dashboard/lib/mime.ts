// Builds the raw RFC 2822 message Gmail's drafts.create expects (base64url).

export interface MimeInput {
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  attachment?: { filename: string; mimeType: string; data: Buffer };
}

const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64");
const wrap = (s: string) => s.replace(/.{1,76}/g, "$&\r\n").trimEnd();

/** RFC 2047 encoding so dashes and accents survive in the subject and file name. */
export function encodeHeader(value: string): string {
  return /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${b64(value)}?=`;
}

export function buildMime(input: MimeInput, boundary = `bsp_${Date.now().toString(36)}`): string {
  const headers = [
    `To: ${input.to.join(", ")}`,
    ...(input.cc.length ? [`Cc: ${input.cc.join(", ")}`] : []),
    `Subject: ${encodeHeader(input.subject)}`,
    "MIME-Version: 1.0",
  ];
  const textPart = [
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrap(b64(input.body)),
  ].join("\r\n");

  let message: string;
  if (!input.attachment) {
    message = [...headers, textPart].join("\r\n");
  } else {
    const name = encodeHeader(input.attachment.filename);
    message = [
      ...headers,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      textPart,
      `--${boundary}`,
      `Content-Type: ${input.attachment.mimeType}; name="${name}"`,
      `Content-Disposition: attachment; filename="${name}"`,
      "Content-Transfer-Encoding: base64",
      "",
      wrap(input.attachment.data.toString("base64")),
      `--${boundary}--`,
    ].join("\r\n");
  }
  return Buffer.from(message).toString("base64url");
}
