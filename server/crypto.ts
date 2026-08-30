import crypto from "crypto";

let _key: Buffer | null = null;
let _initFailed = false;

function getKey(): Buffer | null {
  if (_key) return _key;
  if (_initFailed) return null;
  const k = process.env.BANK_ENCRYPTION_KEY;
  if (!k) {
    console.warn("BANK_ENCRYPTION_KEY not set — bank details stored in plaintext");
    _initFailed = true;
    return null;
  }
  const buf = Buffer.from(k, "base64");
  if (buf.length !== 32) {
    console.warn("BANK_ENCRYPTION_KEY must be 32 bytes base64 — bank details stored in plaintext");
    _initFailed = true;
    return null;
  }
  _key = buf;
  return _key;
}

export function encryptObject(obj: any): string {
  const key = getKey();
  if (!key) return JSON.stringify(obj);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const json = Buffer.from(JSON.stringify(obj), "utf8");
  const enc = Buffer.concat([cipher.update(json), cipher.final()]);
  const tag = cipher.getAuthTag();
  return "enc:" + Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptToObject(ciphertext: string): any {
  if (ciphertext.startsWith("enc:")) {
    const key = getKey();
    if (!key) return JSON.parse(ciphertext.slice(4));
    const buf = Buffer.from(ciphertext.slice(4), "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return JSON.parse(dec.toString("utf8"));
  }
  return JSON.parse(ciphertext);
}
