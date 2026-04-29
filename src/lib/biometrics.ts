function b64UrlToBytes(b64url: string) {
  const pad = '='.repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function bytesToB64Url(bytes: Uint8Array) {
  let raw = '';
  for (const b of bytes) raw += String.fromCharCode(b);
  const b64 = btoa(raw);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function isBiometricsSupported() {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials;
}

export function storageKeyForCredential(userId: string) {
  return `aelyn.biometric.credId.${userId}`;
}

export function isBiometricsEnabled(userId: string) {
  return !!localStorage.getItem(storageKeyForCredential(userId));
}

export async function enrollBiometrics(userId: string) {
  if (!isBiometricsSupported()) throw new Error('Biometrics not supported on this device/browser.');

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userHandle = crypto.getRandomValues(new Uint8Array(32));

  const credential = (await navigator.credentials.create({
    publicKey: {
      rp: { name: 'Aelyn Finance' },
      user: { id: userHandle, name: userId, displayName: 'Aelyn User' },
      challenge,
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }], // ES256
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60_000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error('Biometric enrollment was canceled.');

  const rawId = new Uint8Array(credential.rawId);
  localStorage.setItem(storageKeyForCredential(userId), bytesToB64Url(rawId));
  return true;
}

export async function biometricUnlock(userId: string) {
  if (!isBiometricsSupported()) throw new Error('Biometrics not supported on this device/browser.');

  const credId = localStorage.getItem(storageKeyForCredential(userId));
  if (!credId) throw new Error('Biometrics not enabled for this account.');

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ type: 'public-key', id: b64UrlToBytes(credId) }],
      userVerification: 'required',
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;

  if (!assertion) throw new Error('Biometric unlock was canceled.');
  return true;
}

export function disableBiometrics(userId: string) {
  localStorage.removeItem(storageKeyForCredential(userId));
}

