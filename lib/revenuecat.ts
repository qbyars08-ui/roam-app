// =============================================================================
// ROAM — RevenueCat Subscription Integration
// =============================================================================

import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const REVENUECAT_ANDROID_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

/** The entitlement identifier configured in the RevenueCat dashboard */
const PRO_ENTITLEMENT = 'pro';

/** Offering identifier in RevenueCat */
const DEFAULT_OFFERING = 'default';

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

let isInitialized = false;

/**
 * Initialize RevenueCat with the appropriate platform API key.
 * Call this once on app startup after authentication.
 *
 * @param userId  Supabase user ID to associate with RevenueCat
 */
export async function initRevenueCat(userId?: string): Promise<void> {
  if (isInitialized) return;

  const apiKey =
    Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

  if (!apiKey) {
    console.warn(
      '[RevenueCat] Missing API key for platform:',
      Platform.OS
    );
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({
    apiKey,
    appUserID: userId ?? undefined,
  });

  isInitialized = true;
}

// ---------------------------------------------------------------------------
// Pro status check
// ---------------------------------------------------------------------------

/**
 * Check whether the current user has an active "pro" entitlement.
 */
export async function checkProStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return isProFromCustomerInfo(customerInfo);
  } catch (err) {
    console.warn('[RevenueCat] Failed to check pro status:', err);
    return false;
  }
}

function isProFromCustomerInfo(info: CustomerInfo): boolean {
  const entitlement = info.entitlements.active[PRO_ENTITLEMENT];
  return entitlement !== undefined && entitlement !== null;
}

// ---------------------------------------------------------------------------
// Purchase flows
// ---------------------------------------------------------------------------

/**
 * Fetch available packages from the default offering.
 */
async function getPackages(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  const offering = offerings.current ?? offerings.all[DEFAULT_OFFERING];

  if (!offering) {
    throw new Error('No offerings configured in RevenueCat');
  }

  return offering.availablePackages;
}

/**
 * Purchase the monthly Pro subscription.
 * Returns true if the purchase succeeded and the user is now Pro.
 */
export async function purchaseProMonthly(): Promise<boolean> {
  try {
    const packages = await getPackages();
    const monthly = packages.find(
      (pkg) => pkg.packageType === 'MONTHLY'
    );

    if (!monthly) {
      throw new Error('Monthly package not found in offerings');
    }

    const { customerInfo } = await Purchases.purchasePackage(monthly);
    return isProFromCustomerInfo(customerInfo);
  } catch (err: any) {
    // User cancelled — not an error
    if (err.userCancelled) return false;
    console.error('[RevenueCat] Monthly purchase error:', err);
    throw err;
  }
}

/**
 * Purchase the annual Pro subscription.
 * Returns true if the purchase succeeded and the user is now Pro.
 */
export async function purchaseProAnnual(): Promise<boolean> {
  try {
    const packages = await getPackages();
    const annual = packages.find(
      (pkg) => pkg.packageType === 'ANNUAL'
    );

    if (!annual) {
      throw new Error('Annual package not found in offerings');
    }

    const { customerInfo } = await Purchases.purchasePackage(annual);
    return isProFromCustomerInfo(customerInfo);
  } catch (err: any) {
    if (err.userCancelled) return false;
    console.error('[RevenueCat] Annual purchase error:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Restore purchases
// ---------------------------------------------------------------------------

/**
 * Restore previous purchases (e.g. after reinstalling or switching devices).
 * Returns true if the user has an active Pro entitlement after restoration.
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return isProFromCustomerInfo(customerInfo);
  } catch (err) {
    console.error('[RevenueCat] Restore error:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// User identity
// ---------------------------------------------------------------------------

/**
 * Log in a user to RevenueCat (call after Supabase auth).
 * Transfers any anonymous purchases to the identified user.
 */
export async function loginRevenueCat(userId: string): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    return isProFromCustomerInfo(customerInfo);
  } catch (err) {
    console.warn('[RevenueCat] Login error:', err);
    return false;
  }
}

/**
 * Log out the current user from RevenueCat (call on sign-out).
 * Creates a new anonymous user.
 */
export async function logoutRevenueCat(): Promise<void> {
  try {
    await Purchases.logOut();
  } catch (err) {
    console.warn('[RevenueCat] Logout error:', err);
  }
}
