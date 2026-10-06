import { getDB, uid, updateDB, updateSession, USE_FIREBASE } from './store';
import { hashPassword } from '../lib/util';

// Sign-up, sign-in and staff accounts. The live site uses Firebase logins
// (they work on any device). The preview keeps accounts in this browser only.

const live = () => import('./firebase');

export async function friendlyError(err: unknown): Promise<string> {
  if (USE_FIREBASE) return (await live()).friendlyError(err);
  return (err as Error)?.message || 'Something went wrong. Try again.';
}

export async function customerSignUp(name: string, email: string, password: string) {
  email = email.trim().toLowerCase();
  if (password.length < 8) throw new Error('Use at least 8 characters for your password.');
  if (USE_FIREBASE) return (await live()).customerSignUp(name.trim(), email, password);
  const db = getDB();
  if (db.customers.some((c) => c.email === email)) throw new Error('An account with that email already exists. Sign in instead.');
  const passwordHash = await hashPassword(email, password);
  const id = uid('c');
  updateDB((d) => {
    d.customers.push({ id, email, name: name.trim(), passwordHash });
    d.orders.forEach((o) => {
      if (!o.customerId && o.email === email) o.customerId = id;
    });
  });
  updateSession({ customerId: id });
}

export async function customerSignIn(email: string, password: string) {
  email = email.trim().toLowerCase();
  if (USE_FIREBASE) return (await live()).signIn(email, password);
  const hash = await hashPassword(email, password);
  const c = getDB().customers.find((x) => x.email === email);
  if (!c || c.passwordHash !== hash) throw new Error('That email and password don’t match an account. Check them, or create an account.');
  updateSession({ customerId: c.id });
}

export async function signOutCustomer() {
  if (USE_FIREBASE) return (await live()).signOutAll();
  updateSession({ customerId: undefined });
}

export async function setupMainAdmin(name: string, email: string, password: string) {
  email = email.trim().toLowerCase();
  if (password.length < 10) throw new Error('Use at least 10 characters for the admin password.');
  if (USE_FIREBASE) return (await live()).setupMainAdmin(name.trim(), email, password);
  const passwordHash = await hashPassword(email, password);
  const id = uid('a');
  updateDB((d) => {
    d.admins.push({ id, email, name: name.trim(), passwordHash });
    d.mainAdminId = id;
  });
  updateSession({ adminId: id });
}

export async function staffSignIn(email: string, password: string) {
  email = email.trim().toLowerCase();
  if (USE_FIREBASE) return (await live()).staffSignIn(email, password);
  const hash = await hashPassword(email, password);
  const a = getDB().admins.find((x) => x.email === email);
  if (!a || a.passwordHash !== hash) throw new Error('That email and password don’t match a staff account.');
  updateSession({ adminId: a.id });
}

export async function signOutStaff() {
  if (USE_FIREBASE) return (await live()).signOutAll();
  updateSession({ adminId: undefined });
}

export async function addStaff(name: string, email: string, password: string) {
  email = email.trim().toLowerCase();
  if (password.length < 10) throw new Error('Use at least 10 characters for the password.');
  if (getDB().admins.some((a) => a.email === email)) throw new Error('That email already has staff access.');
  if (USE_FIREBASE) return (await live()).addStaff(name.trim(), email, password);
  const passwordHash = await hashPassword(email, password);
  updateDB((d) => {
    d.admins.push({ id: uid('a'), email, name: name.trim(), passwordHash });
  });
}

export async function removeStaff(id: string) {
  if (USE_FIREBASE) return (await live()).removeStaff(id);
  updateDB((d) => {
    d.admins = d.admins.filter((a) => a.id !== id);
  });
}

export async function changeMyPassword(adminId: string, password: string) {
  if (password.length < 10) throw new Error('Use at least 10 characters for the password.');
  if (USE_FIREBASE) return (await live()).changeMyPassword(password);
  const me = getDB().admins.find((a) => a.id === adminId);
  if (!me) return;
  const passwordHash = await hashPassword(me.email, password);
  updateDB((d) => {
    d.admins.find((a) => a.id === adminId)!.passwordHash = passwordHash;
  });
}
