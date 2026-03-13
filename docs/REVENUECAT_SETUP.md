# RevenueCat Dashboard Setup for ROAM

Do the following manually in the RevenueCat dashboard (https://app.revenuecat.com):

## 1. Create Products (App Store Connect / Google Play Console first)

In App Store Connect (iOS) and Google Play Console (Android), create:

| Product ID           | Type   | Price    |
|----------------------|--------|----------|
| `roam_pro_monthly`   | Auto-renewable subscription | $9.99/month |
| `roam_global_yearly` | Auto-renewable subscription | $49.99/year |

## 2. In RevenueCat Dashboard

### Products
- **roam_pro_monthly** — $9.99/month
- **roam_global_yearly** — $49.99/year

### Entitlement
- Create entitlement: **pro**
- Attach both products to **pro**

### Offering
- Create offering: **default**
- Attach both products (monthly + annual) to **default**

## 3. Verify

After setup, the app will:
- Show live prices from RevenueCat on the paywall
- Use `purchasePro()` for monthly and `purchaseGlobal()` for annual
- Grant Pro/Global via the **pro** entitlement
