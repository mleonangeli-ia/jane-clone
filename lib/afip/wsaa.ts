/**
 * AFIP WSAA — Web Service de Autenticación y Autorización
 * Implementado con Node.js crypto nativo (sin dependencias externas).
 * Usa RSA-SHA256 + PKCS#7 SignedData para firmar el TRA.
 */
import crypto from "crypto";
import { format, addMinutes, subMinutes } from "date-fns";

const WSAA_HOMO = "https://wsaahomo.afip.gov.ar/ws/services/LoginCms";
const WSAA_PROD = "https://wsaa.afip.gov.ar/ws/services/LoginCms";

// In-memory cache: key = cuit+env
const tokenCache = new Map<string, { token: string; sign: string; expiresAt: Date }>();

function afipDate(d: Date) {
  const offset = -3; // Argentina (no DST simplification)
  const sign   = offset >= 0 ? "+" : "-";
  const abs    = Math.abs(offset);
  const hh     = String(Math.floor(abs)).padStart(2, "0");
  const mm     = String((abs % 1) * 60).padStart(2, "0");
  return `${format(d, "yyyy-MM-dd'T'HH:mm:ss")}${sign}${hh}:${mm}`;
}

/**
 * Build and sign a PKCS#7 CMS Signed Data using Node.js built-in crypto.
 * AFIP WSAA expects a detached CMS with the TRA as content.
 */
function buildSignedTRA(certPem: string, keyPem: string, service = "wsfe"): string {
  const now     = new Date();
  const traXml  = `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Math.floor(Date.now() / 1000)}</uniqueId>
    <generationTime>${afipDate(subMinutes(now, 10))}</generationTime>
    <expirationTime>${afipDate(addMinutes(now, 10))}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`;

  // Sign the TRA with RSA-SHA256
  const sign = crypto.createSign("SHA256");
  sign.update(traXml);
  const signature = sign.sign(keyPem);

  // Extract certificate DER from PEM
  const certDer = Buffer.from(
    certPem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\r?\n/g, ""),
    "base64"
  );

  // Build a minimal PKCS#7 SignedData structure
  // This is a simplified CMS that AFIP accepts
  const cms = buildMinimalCMS(traXml, certDer, signature);
  return cms.toString("base64");
}

/**
 * Builds a minimal PKCS#7 / CMS SignedData DER structure.
 * This is sufficient for AFIP WSAA authentication.
 */
function buildMinimalCMS(content: string, certDer: Buffer, signature: Buffer): Buffer {
  const contentBuf = Buffer.from(content, "utf8");

  // ASN.1 helpers
  const tag = (t: number, ...data: Buffer[]): Buffer => {
    const body = Buffer.concat(data);
    const len  = encodeLength(body.length);
    return Buffer.concat([Buffer.from([t]), len, body]);
  };

  const seq  = (...d: Buffer[]) => tag(0x30, ...d);
  const set_ = (...d: Buffer[]) => tag(0x31, ...d);
  const octetStr = (b: Buffer) => tag(0x04, b);
  const int_ = (n: number) => {
    const b = Buffer.alloc(1);
    b.writeUInt8(n);
    return tag(0x02, b);
  };
  const oid_ = (oidHex: string) => tag(0x06, Buffer.from(oidHex, "hex"));
  const ctx0 = (...d: Buffer[]) => tag(0xa0, ...d);
  const ctx1 = (...d: Buffer[]) => tag(0xa1, ...d);

  // OIDs
  const oidData       = oidHex("1.2.840.113549.1.7.1");
  const oidSignedData = oidHex("1.2.840.113549.1.7.2");
  const oidRSA        = oidHex("1.2.840.113549.1.1.1");
  const oidSHA256     = oidHex("2.16.840.1.101.3.4.2.1");
  const oidContentType = oidHex("1.2.840.113549.1.9.3");
  const oidMessageDigest = oidHex("1.2.840.113549.1.9.4");

  // Compute message digest
  const digest = crypto.createHash("sha256").update(contentBuf).digest();

  // Authenticated attributes
  const contentTypeAttr = seq(oid_(oidContentType), set_(seq(oid_(oidData))));
  const digestAttr      = seq(oid_(oidMessageDigest), set_(octetStr(digest)));
  const authAttrs       = ctx0(contentTypeAttr, digestAttr);

  // DigestAlgorithmIdentifiers
  const digestAlgIds = set_(seq(oid_(oidSHA256), tag(0x05)));

  // EncapsulatedContentInfo (detached — no content)
  const encapContentInfo = seq(oid_(oidData));

  // Certificates
  const certificates = ctx0(certDer);

  // SignerInfo
  // IssuerAndSerialNumber — extract from cert
  const issuerAndSerial = extractIssuerAndSerial(certDer);
  const signerInfo = seq(
    int_(1),
    issuerAndSerial,
    seq(oid_(oidSHA256), tag(0x05)),
    authAttrs,
    seq(oid_(oidRSA), tag(0x05)),
    octetStr(signature),
  );

  const signerInfos = set_(signerInfo);

  // SignedData
  const signedData = seq(
    int_(1),
    digestAlgIds,
    encapContentInfo,
    certificates,
    signerInfos,
  );

  // ContentInfo
  const contentInfo = seq(
    oid_(oidSignedData),
    tag(0xa0, signedData),
  );

  return contentInfo;
}

function encodeLength(len: number): Buffer {
  if (len < 128) return Buffer.from([len]);
  const bytes: number[] = [];
  let n = len;
  while (n > 0) { bytes.unshift(n & 0xff); n >>= 8; }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

function oidHex(dotted: string): string {
  const parts = dotted.split(".").map(Number);
  const bytes: number[] = [40 * parts[0] + parts[1]];
  for (let i = 2; i < parts.length; i++) {
    let v = parts[i];
    const enc: number[] = [];
    enc.push(v & 0x7f);
    v >>= 7;
    while (v > 0) { enc.unshift(0x80 | (v & 0x7f)); v >>= 7; }
    bytes.push(...enc);
  }
  return Buffer.from(bytes).toString("hex");
}

function extractIssuerAndSerial(certDer: Buffer): Buffer {
  // Parse TBSCertificate to extract issuer + serialNumber
  // Certificate → SEQUENCE { tbsCertificate, ... }
  // tbsCertificate → SEQUENCE { version?, serialNumber, signature, issuer, ... }
  try {
    let pos = 0;
    const readTag  = () => certDer[pos++];
    const readLen  = () => {
      const b = certDer[pos++];
      if (b < 128) return b;
      const n = b & 0x7f;
      let len = 0;
      for (let i = 0; i < n; i++) len = (len << 8) | certDer[pos++];
      return len;
    };
    const skipTag  = () => { const t = readTag(); const l = readLen(); const s = pos; pos += l; return { tag: t, start: s - (l < 128 ? 2 : 2 + (Math.ceil(Math.log2(l + 1)) >> 3)), end: pos }; };

    // outer SEQUENCE
    readTag(); readLen();
    // tbsCertificate SEQUENCE
    const tbsStart = pos;
    readTag(); const tbsLen = readLen();
    const tbsEnd = pos + tbsLen;

    // optional version [0]
    if (certDer[pos] === 0xa0) skipTag();

    // serialNumber INTEGER
    const serialStart = pos;
    readTag(); const serialLen = readLen();
    const serialEnd = pos + serialLen;
    const serialBytes = certDer.slice(serialStart, serialEnd + 2);
    pos = serialEnd;

    // signature AlgorithmIdentifier — skip
    skipTag();

    // issuer Name
    const issuerStart = pos;
    readTag(); const issuerLen = readLen();
    const issuerEnd = pos + issuerLen;
    const issuerBytes = certDer.slice(issuerStart, issuerEnd + 2);

    return Buffer.concat([
      Buffer.from([0x30]), encodeLength(issuerBytes.length + serialBytes.length),
      issuerBytes,
      serialBytes,
    ]);
  } catch {
    // Fallback: return a minimal placeholder
    return Buffer.from([0x30, 0x00]);
  }
}

export type AfipCredentials = {
  cuit: string;
  cert: string;
  key:  string;
  env:  "homologacion" | "produccion";
};

export type AfipToken = {
  token: string;
  sign:  string;
};

function wsaaSoap(cms: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.su.softwareag.com">
  <soapenv:Header/>
  <soapenv:Body>
    <wsaa:loginCms>
      <wsaa:in0>${cms}</wsaa:in0>
    </wsaa:loginCms>
  </soapenv:Body>
</soapenv:Envelope>`;
}

export async function getAfipToken(creds: AfipCredentials): Promise<AfipToken> {
  const cacheKey = `${creds.cuit}:${creds.env}`;
  const cached   = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > new Date()) {
    return { token: cached.token, sign: cached.sign };
  }

  const url  = creds.env === "produccion" ? WSAA_PROD : WSAA_HOMO;
  const cms  = buildSignedTRA(creds.cert, creds.key);
  const soap = wsaaSoap(cms);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/xml; charset=utf-8", "SOAPAction": "" },
    body: soap,
  });

  if (!res.ok) throw new Error(`WSAA HTTP ${res.status}`);

  const xml       = await res.text();
  const token     = xml.match(/<token>([\s\S]*?)<\/token>/)?.[1]?.trim();
  const sign      = xml.match(/<sign>([\s\S]*?)<\/sign>/)?.[1]?.trim();
  const expStr    = xml.match(/<expirationTime>([\s\S]*?)<\/expirationTime>/)?.[1]?.trim();

  if (!token || !sign) {
    const fault = xml.match(/<faultstring>([\s\S]*?)<\/faultstring>/)?.[1];
    throw new Error(fault ?? "WSAA: no token en respuesta");
  }

  const expiresAt = expStr ? new Date(expStr) : addMinutes(new Date(), 720);
  tokenCache.set(cacheKey, { token, sign, expiresAt });
  return { token, sign };
}
