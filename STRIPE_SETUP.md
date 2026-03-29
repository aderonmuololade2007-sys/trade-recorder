# 🚀 STRIPE SETUP FOR TRADE JOURNAL

## Step 1: Create Stripe Account
1. Go to [stripe.com](https://stripe.com)
2. Click "Start now" → "Create account"
3. Fill in your details (use test/business info for now)
4. Verify your email

## Step 2: Get Your API Keys
1. In Stripe Dashboard, click "Developers" (left sidebar)
2. Click "API keys"
3. Copy your **Test Publishable key** (starts with `pk_test_`)
4. Copy your **Test Secret key** (starts with `sk_test_`)

## Step 3: Create Your Product
1. In Stripe Dashboard, click "Products" (left sidebar)
2. Click "Create product"
3. Fill in:
   - **Name**: "Trade Journal Premium"
   - **Description**: "Monthly premium subscription for advanced trading features"
4. Click "Create product"

## Step 4: Add Pricing
1. In your new product, click "Add pricing"
2. Choose "Recurring" (subscription)
3. Set:
   - **Price**: $9.99
   - **Currency**: USD
   - **Billing interval**: Monthly
4. Click "Add price"

## Step 5: Get Your Price ID
1. In your product, find the price you just created
2. Click on it to see details
3. Copy the **API ID** (starts with `price_`)

## Step 6: Update Your Config
Replace in your `config.js` file:

```javascript
// Stripe Configuration (Test Mode - FREE)
stripe: {
    publishableKey: "pk_test_YOUR_ACTUAL_TEST_KEY_HERE", // Your real test key
    products: {
        premium_journal: {
            priceId: "price_YOUR_PRICE_ID_HERE", // Your real price ID
            price: 9.99,
            interval: "month"
        }
    }
},
```

## Step 7: Test Your Payment
1. Upload your files to GitHub Pages
2. Visit your live site
3. Register/Login
4. Click "Upgrade to Premium"
5. Use test card: `4242 4242 4242 4242`
6. Any future expiry date, any CVC

## 🎯 What You'll Have:
- ✅ Working test payments (no real money)
- ✅ Professional checkout experience
- ✅ Subscription management
- ✅ Webhook notifications

## 🔄 To Go Live (Real Money):
1. Switch to "Live" mode in Stripe
2. Get live API keys
3. Add bank account for payouts
4. Update config.js with live keys
5. Test with real card (small amount)

## 📞 Need Help?
If you get stuck:
1. Check the Stripe Dashboard
2. Look for error messages in browser console
3. Make sure your keys are correct

## 💡 Pro Tips:
- Keep test mode on until you're ready for real payments
- Use different test cards for different scenarios
- Check Stripe logs for any issues