# GitHub Pages Deployment for Trade Journal

## 🚀 FREE GitHub Pages Setup

### Step 1: Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `trade-journal`
4. Make it **Public** (required for free GitHub Pages)
5. Don't initialize with README
6. Click "Create repository"

### Step 2: Upload Your Files
1. Download all files from your `trade recorder` folder
2. Go to your new GitHub repository
3. Click "Add file" → "Upload files"
4. Drag and drop all your project files
5. Click "Commit changes"

### Step 3: Enable GitHub Pages
1. In your repository, click "Settings" tab
2. Scroll down to "Pages" section
3. Under "Source", select "Deploy from a branch"
4. Under "Branch", select "main" and "/ (root)"
5. Click "Save"

### Step 4: Get Your Free Website URL
Your site will be live at: `https://YOUR_USERNAME.github.io/trade-journal`

**Example:** If your GitHub username is "trader123", your site will be:
`https://trader123.github.io/trade-journal`

## 💳 FREE Stripe Test Mode

### Step 1: Get Stripe Test Keys (FREE)
1. Go to [stripe.com](https://stripe.com)
2. Click "Start now" → Create free account
3. Go to Dashboard → Developers → API keys
4. Copy your **Test** keys (they start with `pk_test_` and `sk_test_`)

### Step 2: Update Your Config
In your `config.js` file, replace:
```javascript
stripe: {
    publishableKey: "pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE"
}
```

### Step 3: Test Payments (FREE)
Use these test card numbers:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- Any future expiry date and any CVC

## 🎯 What You Get For FREE

✅ **Free Website:** `https://username.github.io/trade-journal`
✅ **Free Hosting:** Unlimited bandwidth
✅ **Free SSL:** Automatic HTTPS
✅ **Free Stripe:** Test mode (no real money)
✅ **Custom Domain Later:** Can add paid domain anytime

## 🔄 To Go Live With Real Payments

When you're ready for real payments:
1. Switch Stripe to "Live" mode
2. Get live API keys
3. Add a custom domain ($10-15/year)
4. Connect bank account for payouts

## 📝 Quick Setup Checklist

- [ ] Create GitHub account (if you don't have one)
- [ ] Create `trade-journal` repository
- [ ] Upload all project files
- [ ] Enable GitHub Pages
- [ ] Create Stripe account
- [ ] Add test API keys to config.js
- [ ] Test the website

**Total Cost: $0** (completely free!)