import { Auth } from 'firebase/auth';
import { Functions } from 'firebase/functions';
import {
  linkWithPasskey,
  unlinkPasskey,
  signInWithPasskey,
  verifyUserWithPasskey,
} from '@firebase-web-authn/browser';

export function isBiometricsSupported() {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials;
}

export async function signInWithBiometrics(auth: Auth, functions: Functions) {
  if (!isBiometricsSupported()) throw new Error('Biometrics not supported on this device/browser.');
  return signInWithPasskey(auth, functions);
}

export async function enableBiometrics(auth: Auth, functions: Functions, displayName: string) {
  if (!isBiometricsSupported()) throw new Error('Biometrics not supported on this device/browser.');
  // Links a passkey to the currently signed-in user.
  await linkWithPasskey(auth, functions, displayName || 'Aelyn User');
  return true;
}

export async function disableBiometrics(auth: Auth, functions: Functions) {
  if (!isBiometricsSupported()) throw new Error('Biometrics not supported on this device/browser.');
  await unlinkPasskey(auth, functions);
  return true;
}

export async function verifyBiometrics(auth: Auth, functions: Functions) {
  if (!isBiometricsSupported()) throw new Error('Biometrics not supported on this device/browser.');
  await verifyUserWithPasskey(auth, functions);
  return true;
}

