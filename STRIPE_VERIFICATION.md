# 💳 STRIPE BUSINESS VERIFICATION FOR LIVE PAYMENTS

## Why Stripe Asks for Business Verification

When you switch from **Test Mode** to **Live Mode**, Stripe needs to verify your business to:
- ✅ Comply with financial regulations
- ✅ Prevent fraud and money laundering
- ✅ Ensure you're a legitimate business
- ✅ Set up proper tax reporting

## 📋 What Information Stripe Needs

### **Basic Business Information**
- Business name and address
- Business type (sole proprietorship, LLC, corporation, etc.)
- Tax ID (EIN, SSN, or equivalent)
- Business phone number
- Business website (your GitHub Pages site)

### **Personal Information**
- Your full name
- Date of birth
- Home address
- Social Security Number (or equivalent)
- Government-issued ID (passport or driver's license)

### **Bank Account Information**
- Bank account for receiving payments
- Routing number and account number
- Bank account ownership verification

## 🚀 Step-by-Step Verification Process

### **Step 1: Switch to Live Mode**
1. In Stripe Dashboard → Click your account name (top right)
2. Click "Switch to live mode"
3. Confirm you want to go live

### **Step 2: Complete Business Profile**
1. Dashboard → Settings → Business details
2. Fill in all required fields:
   - **Business name**: "Trade Journal" or your business name
   - **Business type**: Choose what's appropriate for you
   - **Business address**: Your business address
   - **Tax ID**: Your EIN or SSN
   - **Phone**: Business phone number
   - **Website**: `https://yourusername.github.io/trade-journal`

### **Step 3: Add Personal Information**
1. Dashboard → Settings → Personal details
2. Provide your personal information
3. Upload government ID (photo of passport or driver's license)

### **Step 4: Connect Bank Account**
1. Dashboard → Settings → Bank accounts
2. Add your bank account details
3. Verify ownership (Stripe may deposit small amounts)

### **Step 5: Submit for Review**
1. Stripe will review your application (usually 24-48 hours)
2. You may need to provide additional documents
3. Once approved, you can accept real payments

## 📄 Required Documents (Depending on Your Business Type)

### **For Sole Proprietorship:**
- Government-issued ID
- Social Security Number
- Business license (if applicable)

### **For LLC/Corporation:**
- Articles of Organization
- EIN confirmation
- Business license
- Government-issued ID of owners

### **For International Businesses:**
- Additional tax documents
- Local business registration
- Currency exchange setup

## 💰 What Happens After Verification

### **Approved ✅**
- You can accept real payments
- Money goes to your bank account
- Stripe fees: 2.9% + $0.30 per transaction
- Payouts: Usually 2-7 business days

### **Additional Information Requested 📝**
- Stripe will email you what they need
- Usually takes 1-2 days to provide
- Re-review takes another 24-48 hours

### **Rejected ❌**
- Rare, but possible
- Stripe will explain why
- You can reapply after fixing issues

## ⚡ Tips for Faster Approval

1. **Be Honest**: Provide accurate information
2. **Complete Profile**: Fill in ALL fields
3. **Clear Photos**: Good quality ID photos
4. **Business Structure**: Choose the right business type
5. **Professional Website**: Your GitHub Pages site helps

## 🔄 Switching Between Test and Live

- **Test Mode**: `pk_test_...` keys - no real money
- **Live Mode**: `pk_live_...` keys - real payments
- You can have both modes active simultaneously
- Test in test mode, go live when ready

## 💡 Alternative: Stay in Test Mode

If verification is too much right now:
- Keep using test mode
- No real money changes hands
- Full functionality for development
- Switch to live when you're ready

## 🆘 Need Help with Verification?

If Stripe requests specific documents:
1. Check your email for Stripe messages
2. Look in Dashboard → Balance → Payouts
3. Contact Stripe support through their dashboard

## 📞 Contact Information

- **Stripe Support**: Available in your dashboard
- **Business Verification**: Usually 24/7 support
- **Document Upload**: Through secure dashboard

## 🎯 Next Steps After Approval

1. Get your **live API keys** (`pk_live_...`)
2. Update `config.js` with live keys
3. Test with real card (small amount)
4. Set up webhook endpoints (optional)
5. Start accepting real payments!

**Verification usually takes 1-2 business days once you submit everything.** ⏱️