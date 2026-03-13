// =============================================================================
// ROAM — RevenueCat Integration (Public API)
// Initialize on app start, sync Pro status with Zustand store
// =============================================================================

import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';

const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
const PRO_ENTITLEMENT = 'pro';
const DEFAULT_OFFERING = 'default';
const PRO_MONTHLY_ID = 'roam_pro_monthly';
const GLOBAL_YEARLY_ID = 'roam_global_yearly';

let isInitialized = false;

function getApiKey(): string {
  return Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
}

/**
 * Initialize RevenueCat on app start. Call before anything else.
 * Safe to call on web (no-op).
 */
export async function initRevenueCat(userId?: string): Promise<void> {
  if (Platform.OS === 'web') return;
  if (isInitialized) return;

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[RevenueCat] Missing API key for platform:', Platform.OS);
    return;
  }

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    Purchases.configure({
      apiKey,
      appUserID: userId ?? undefined,
    });
    isInitialized = true;
  } catch (err) {
    console.warn('[RevenueCat] Init failed:', err);
  }
}

/**
 * Log in user to RevenueCat (call when user signs in).
 * Transfers anonymous purchases to identified user.
 */
export async function loginRevenueCat(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Purchases.logIn(userId);
  } catch (err) {
    console.warn('[RevenueCat] Login failed:', err);
  }
}

/**
 * Log out user (call when user signs out).
 */
export async function logoutRevenueCat(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Purchases.logOut();
  } catch (err) {
    console.warn('[RevenueCat] Logout failed:', err);
  }
}

export type PlanType = 'free' | 'pro' | 'global';

/**
 * Get current plan from RevenueCat.
 * Returns 'global' for annual, 'pro' for monthly, 'free' otherwise.
 */
export async function getCurrentPlan(): Promise<PlanType> {
  if (Platform.OS === 'web') return 'free';
  try {
    const info = await Purchases.getCustomerInfo();
    return planFromCustomerInfo(info);
  } catch (err) {
    console.warn('[RevenueCat] getCurrentPlan failed:', err);
    return 'free';
  }
}

function planFromCustomerInfo(info: CustomerInfo): PlanType {
  const ent = info.entitlements.active[PRO_ENTITLEMENT];
  if (!ent) return 'free';
  const productId = ent.productIdentifier ?? '';
  if (productId === GLOBAL_YEARLY_ID) return 'global';
  return 'pro';
}

/**
 * Check if user has an active Pro or Global subscription.
 */
export async function isProActive(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const plan = await getCurrentPlan();
    return plan === 'pro' || plan === 'global';
  } catch (err) {
    console.warn('[RevenueCat] isProActive failed:', err);
    return false;
  }
}

async function getPackages(): Promise<{ monthly: PurchasesPackage | null; annual: PurchasesPackage | null }> {
  try {
    const offerings = await Purchases.getOfferings();
    const offering = offerings.current ?? offerings.all[DEFAULT_OFFERING];
    if (!offering) return { monthly: null, annual: null };

    const packages = offering.availablePackages;
    const monthly = packages.find((p) => p.packageType === 'MONTHLY' || p.identifier === PRO_MONTHLY_ID) ?? null;
    const annual = packages.find((p) => p.packageType === 'ANNUAL' || p.identifier === GLOBAL_YEARLY_ID) ?? null;
    return { monthly, annual };
  } catch (err) {
    console.warn('[RevenueCat] getPackages failed:', err);
    return { monthly: null, annual: null };
  }
}

/**
 * Trigger $9.99/month Pro purchase flow.
 * Returns true on success, false on cancel, throws on error.
 */
export async function purchasePro(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { monthly } = await getPackages();
    if (!monthly) {
      throw new Error('Pro monthly package not found');
    }
    const { customerInfo } = await Purchases.purchasePackage(monthly);
    return planFromCustomerInfo(customerInfo) !== 'free';
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'userCancelled' in err && (err as Record<string, unknown>).userCancelled) return false;
    throw err;
  }
}

/**
 * Trigger $49.99/year Global Pass purchase flow.
 * Returns true on success, false on cancel, throws on error.
 */
export async function purchaseGlobal(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { annual } = await getPackages();
    if (!annual) {
      throw new Error('Global Pass annual package not found');
    }
    const { customerInfo } = await Purchases.purchasePackage(annual);
    return planFromCustomerInfo(customerInfo) !== 'free';
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'userCancelled' in err && (err as Record<string, unknown>).userCancelled) return false;
    throw err;
  }
}

/**
 * Restore previous purchases.
 * Returns true if user has active Pro/Global after restore.
 */
export async function restorePurchases(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const info = await Purchases.restorePurchases();
    return planFromCustomerInfo(info) !== 'free';
  } catch (err) {
    console.warn('[RevenueCat] restorePurchases failed:', err);
    throw err;
  }
}

/**
 * Add listener for CustomerInfo changes (purchase, restore, expiration).
 * Returns unsubscribe function.
 */
export function addCustomerInfoListener(callback: (isPro: boolean) => void): () => void {
  if (Platform.OS === 'web') return () => {};
  const handler = (info: CustomerInfo) => {
    callback(planFromCustomerInfo(info) !== 'free');
  };
  try {
    Purchases.addCustomerInfoUpdateListener(handler);
  } catch {
    // RevenueCat not configured
  }
  return () => {
    try {
      Purchases.removeCustomerInfoUpdateListener(handler);
    } catch {
      // no-op
    }
  };
}

export type OfferingPackages = {
  monthly: PurchasesPackage | null;
  annual: PurchasesPackage | null;
};

/**
 * Get offerings for paywall display (prices, packages).
 */
export async function getOfferings(): Promise<OfferingPackages> {
  return getPackages();
}
