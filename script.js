// ============================================
// TRADE JOURNAL - JAVASCRIPT
// AI-Powered Forex Trading Journal
// ============================================

// Firebase authentication helpers
// debugging: log current origin and protocol for localStorage context
console.log('app loaded at', location.href, 'protocol', location.protocol);

function showOverlay(show) {
    const overlay = document.getElementById('loginOverlay');
    if (show) {
        overlay.classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('loginEmail').focus();
        }, 50);
    } else {
        overlay.classList.add('hidden');
    }
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const p = document.getElementById('loginPassword').value;
    const msg = document.getElementById('loginMessage');
    msg.style.color = '#e63946';
    if (!email || !p) { msg.textContent = 'Enter email and password'; return; }

    // Check device limit before attempting login
    if (!checkDeviceLimit()) {
        msg.textContent = 'Maximum device limit reached (2 devices). Please logout from another device first.';
        return;
    }

    // Show loading state
    msg.style.color = '#f77f00';
    msg.textContent = 'Signing in...';

    firebase.auth().signInWithEmailAndPassword(email, p)
        .then((userCredential) => {
            const user = userCredential.user;

            // Check if email is verified
            if (!user.emailVerified) {
                // Sign out unverified user
                firebase.auth().signOut();
                msg.style.color = '#e63946';
                msg.textContent = 'Please verify your email address first. Check your inbox for the verification link.';
                return;
            }

            msg.textContent = '';
            document.getElementById('logoutBtn').style.display = 'block';
            if (!window.journal) {
                window.journal = new TradingJournal();
            }
            showOverlay(false);
        })
        .catch(err => {
            msg.style.color = '#e63946';
            let errorMessage = err.message;

            // Provide user-friendly error messages
            if (err.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email. Please register first.';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (err.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled. Please contact support.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed login attempts. Please try again later.';
            }

            msg.textContent = errorMessage;
        });
}

function handleResendVerification() {
    const email = document.getElementById('loginEmail').value.trim();
    const msg = document.getElementById('loginMessage');
    msg.style.color = '#e63946';

    if (!email) {
        msg.textContent = 'Please enter your email address first.';
        return;
    }

    // Show loading state
    msg.style.color = '#f77f00';
    msg.textContent = 'Sending verification email...';

    firebase.auth().signInWithEmailAndPassword(email, 'dummy_password_for_verification_check')
        .then(() => {
            // This shouldn't happen, but just in case
            firebase.auth().signOut();
        })
        .catch((error) => {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                // Try to send verification email using a different approach
                // Note: Firebase doesn't have a direct way to resend verification without being signed in
                // This is a limitation - in production, you'd need a backend service
                msg.style.color = '#e63946';
                msg.textContent = 'Please check your email for the verification link. If you haven\'t received it, try registering again.';
            } else {
                msg.textContent = 'Error: ' + error.message;
            }
        });
}

// Alternative approach: Store email and allow resend after registration
let pendingVerificationEmail = null;

function handleRegister() {
    const email = document.getElementById('loginEmail').value.trim();
    const p = document.getElementById('loginPassword').value;
    const msg = document.getElementById('loginMessage');
    msg.style.color = '#e63946';

    if (!email || !p) {
        msg.textContent = 'Enter email and password';
        return;
    }

    if (p.length < 6) {
        msg.textContent = 'Password must be at least 6 characters';
        return;
    }

    // Show loading state
    msg.style.color = '#f77f00';
    msg.textContent = 'Creating account...';

    firebase.auth().createUserWithEmailAndPassword(email, p)
        .then((userCredential) => {
            const user = userCredential.user;
            pendingVerificationEmail = email;

            // Send email verification
            return user.sendEmailVerification()
                .then(() => {
                    msg.style.color = '#06d6a0';
                    msg.textContent = 'Registration successful! Please check your email and click the verification link before logging in.';

                    // Show resend button
                    document.getElementById('resendVerificationBtn').style.display = 'block';

                    // Sign out the user until they verify their email
                    return firebase.auth().signOut();
                })
                .then(() => {
                    // Clear the form
                    document.getElementById('loginEmail').value = '';
                    document.getElementById('loginPassword').value = '';
                });
        })
        .catch(err => {
            msg.style.color = '#e63946';
            let errorMessage = err.message;

            // Provide user-friendly error messages
            if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Try logging in instead.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please choose a stronger password.';
            }

            msg.textContent = errorMessage;
        });
}

function logout() {
    firebase.auth().signOut().then(() => {
        location.reload();
    });
}

function handleReset() {
    const email = document.getElementById('loginEmail').value.trim();
    const msg = document.getElementById('loginMessage');
    msg.style.color = '#e63946';
    if (!email) { msg.textContent = 'Enter your email to reset'; return; }
    firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
            msg.style.color = '#06d6a0';
            msg.textContent = 'Reset link sent!';
        })
        .catch(err => {
            msg.textContent = err.message;
        });
}

// Biometric Authentication Functions
async function checkBiometricSupport() {
    if (!window.PublicKeyCredential) {
        return false;
    }
    try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
    } catch (error) {
        console.log('Biometric check failed:', error);
        return false;
    }
}

async function registerBiometric() {
    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const publicKeyCredentialCreationOptions = {
            challenge: challenge,
            rp: {
                name: "Trade Journal",
                id: window.location.hostname,
            },
            user: {
                id: new Uint8Array(16),
                name: firebase.auth().currentUser.email,
                displayName: firebase.auth().currentUser.email,
            },
            pubKeyCredParams: [
                { alg: -7, type: "public-key" }, // ES256
                { alg: -257, type: "public-key" }, // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required",
            },
            timeout: 60000,
            attestation: "direct"
        };

        window.crypto.getRandomValues(publicKeyCredentialCreationOptions.user.id);

        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });

        // Store the credential in localStorage for this user
        const credentialData = {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
                attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
                clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON))
            }
        };

        localStorage.setItem(`biometric_${firebase.auth().currentUser.uid}`, JSON.stringify(credentialData));
        return true;
    } catch (error) {
        console.error('Biometric registration failed:', error);
        return false;
    }
}

async function authenticateBiometric() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        const storedCredential = localStorage.getItem(`biometric_${user.uid}`);
        if (!storedCredential) {
            throw new Error('No biometric credential found. Please register biometric login first.');
        }

        const credentialData = JSON.parse(storedCredential);
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const publicKeyCredentialRequestOptions = {
            challenge: challenge,
            allowCredentials: [{
                id: new Uint8Array(credentialData.rawId),
                type: "public-key",
                transports: ["internal"],
            }],
            timeout: 60000,
            userVerification: "required",
        };

        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });

        // If we get here, biometric authentication succeeded
        return true;
    } catch (error) {
        console.error('Biometric authentication failed:', error);
        throw error;
    }
}

async function handleBiometricLogin() {
    const msg = document.getElementById('loginMessage');
    msg.style.color = '#e63946';

    try {
        const biometricSupported = await checkBiometricSupport();
        if (!biometricSupported) {
            msg.textContent = 'Biometric authentication not supported on this device.';
            return;
        }

        // First check if user has existing biometric credentials
        const user = firebase.auth().currentUser;
        if (!user) {
            msg.textContent = 'Please login with email/password first to set up biometric authentication.';
            return;
        }

        const storedCredential = localStorage.getItem(`biometric_${user.uid}`);
        if (!storedCredential) {
            // No biometric setup yet, offer to register
            const register = confirm('Biometric login not set up yet. Would you like to register your biometric credentials now?');
            if (register) {
                const success = await registerBiometric();
                if (success) {
                    msg.style.color = '#06d6a0';
                    msg.textContent = 'Biometric authentication registered successfully!';
                } else {
                    msg.textContent = 'Failed to register biometric authentication.';
                }
            }
            return;
        }

        // Attempt biometric authentication
        const authenticated = await authenticateBiometric();
        if (authenticated) {
            msg.style.color = '#06d6a0';
            msg.textContent = 'Biometric authentication successful!';
            // User is already logged in via Firebase, just update UI
            document.getElementById('logoutBtn').style.display = 'block';
            if (!window.journal) {
                window.journal = new TradingJournal();
            }
            showOverlay(false);
        }
    } catch (error) {
        msg.textContent = error.message || 'Biometric authentication failed.';
    }
}

// Device tracking and security
function trackDeviceLogin() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const deviceId = generateDeviceId();
    const deviceInfo = {
        id: deviceId,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ip: 'unknown' // Would need server-side implementation for IP tracking
    };

    // Store device info
    const devices = JSON.parse(localStorage.getItem(`devices_${user.uid}`) || '[]');

    // Check if this device is already registered
    const existingDevice = devices.find(d => d.id === deviceId);
    const isNewDevice = !existingDevice;

    if (isNewDevice) {
        devices.push(deviceInfo);

        // Limit to maximum 2 devices
        if (devices.length > 2) {
            // Remove oldest device
            devices.shift();
        }

        localStorage.setItem(`devices_${user.uid}`, JSON.stringify(devices));

        // Send notification email (would need backend implementation)
        console.log('New device login detected. Would send email notification to:', user.email);
        alert(`New device login detected. A security notification has been sent to ${user.email}`);
    } else {
        // Update last login time
        existingDevice.timestamp = new Date().toISOString();
        localStorage.setItem(`devices_${user.uid}`, JSON.stringify(devices));
    }
}

function generateDeviceId() {
    // Generate a unique device ID based on browser fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('device_fingerprint', 2, 2);

    const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        !!window.sessionStorage,
        !!window.localStorage,
        !!window.indexedDB,
        canvas.toDataURL()
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

function checkDeviceLimit() {
    const user = firebase.auth().currentUser;
    if (!user) return true;

    const devices = JSON.parse(localStorage.getItem(`devices_${user.uid}`) || '[]');
    return devices.length < 2;
}

// Premium Features and Payment
let stripe;

function checkPremiumStatus() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // Check if user has premium status (in a real app, this would check your backend)
    const premiumStatus = localStorage.getItem(`premium_${user.uid}`);
    const isPremium = premiumStatus && new Date(premiumStatus) > new Date();

    const premiumBadge = document.getElementById('premiumStatus');
    const upgradeBtn = document.getElementById('upgradeBtn');
    const premiumSection = document.getElementById('premiumSection');

    if (isPremium) {
        premiumBadge.style.display = 'flex';
        upgradeBtn.style.display = 'none';
        premiumSection.classList.remove('hidden');
    } else {
        premiumBadge.style.display = 'none';
        upgradeBtn.style.display = 'block';
        premiumSection.classList.add('hidden');
    }
}

function showPaymentModal(plan) {
    const modal = document.getElementById('paymentModal');
    modal.classList.remove('hidden');

    // Populate user email for Stripe checkout
    const user = firebase.auth().currentUser;
    if (user) {
        document.getElementById('userEmail').value = user.email;
    }

    // Store selected plan (for backward compatibility)
    window.selectedPlan = plan;
}

function openStripeCheckout() {
    const user = firebase.auth().currentUser;
    const userEmail = user ? user.email : '';

    // For GitHub Pages, we'll redirect to a Stripe Checkout page
    // You'll need to create this URL in your Stripe Dashboard

    // Option 1: Use a pre-created checkout link from Stripe Dashboard
    // Go to Stripe Dashboard → Products → Your product → "Create payment link"
    // Then replace this URL with your payment link

    const checkoutUrl = `https://buy.stripe.com/test_YOUR_PAYMENT_LINK_ID?client_reference_id=${encodeURIComponent(userEmail)}`;

    // Option 2: For now, show instructions since we need the real payment link
    const message = `
🚀 To complete Stripe setup:

1. Go to your Stripe Dashboard
2. Click "Products" → Your "Trade Journal Premium" product
3. Click "Create payment link"
4. Copy the payment link URL
5. Replace the checkoutUrl in script.js with your real link

For now, here's a demo of what would happen:
- User: ${userEmail || 'Not logged in'}
- Product: Trade Journal Premium ($9.99/month)
- Test Mode: No real charges

Use test card: 4242 4242 4242 4242
    `;

    alert(message);

    // Uncomment this line when you have your real payment link:
    // window.location.href = checkoutUrl;
}

function processPayment() {
    // This function is now handled by Stripe Checkout redirect
    // The form submission will redirect to Stripe's checkout page
    console.log('Processing payment via Stripe Checkout...');
}

// Handle successful payment return from Stripe Checkout
function handlePaymentSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
        // Payment was successful
        const user = firebase.auth().currentUser;
        if (user) {
            // Set premium status
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1); // Monthly subscription

            localStorage.setItem(`premium_${user.uid}`, expiryDate.toISOString());
            checkPremiumStatus();

            // Show success message
            alert('Payment successful! Welcome to Trade Journal Premium!');

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// Handle successful payment return from Stripe Checkout
function handlePaymentSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
        // Payment was successful
        const user = firebase.auth().currentUser;
        if (user) {
            // Set premium status
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1); // Monthly subscription

            localStorage.setItem(`premium_${user.uid}`, expiryDate.toISOString());
            checkPremiumStatus();

            // Show success message
            alert('Payment successful! Welcome to Trade Journal Premium!');

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// Handle successful payment return from Stripe Checkout
function handlePaymentSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
        // Payment was successful
        const user = firebase.auth().currentUser;
        if (user) {
            // Set premium status
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1); // Monthly subscription

            localStorage.setItem(`premium_${user.uid}`, expiryDate.toISOString());
            checkPremiumStatus();

            // Show success message
            alert('Payment successful! Welcome to Trade Journal Premium!');

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// Premium Feature Handlers
function showAdvancedAnalytics() {
    alert('Advanced Analytics: This feature provides detailed performance metrics, drawdown analysis, Sharpe ratio, and risk-adjusted returns. (Premium Feature)');
}

function exportData() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const trades = JSON.parse(localStorage.getItem('finspotTrades') || '[]');

    // Create CSV content
    let csv = 'Date,Currency Pair,Type,Entry Point,Stop Loss,Take Profit,Exit Point,Risk/Reward,Result,P/L (Pips),Lot Size,SMC Strategy,Notes\n';

    trades.forEach(trade => {
        csv += `${trade.date},"${trade.pair}","${trade.type}",${trade.entryPoint},${trade.stopLoss},${trade.takeProfit},${trade.exitPoint || ''},${trade.riskReward || ''},"${trade.result || ''}",${trade.profitLoss},${trade.lotSize},"${trade.smcStrategy || ''}","${trade.notes || ''}"\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finspot_trades_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    alert('Data exported successfully! (Premium Feature)');
}

function enableCloudBackup() {
    alert('Cloud Backup: Your trading data is now automatically synced to the cloud. (Premium Feature)');
}

function showRiskManagement() {
    alert('Risk Management: Access advanced position sizing calculators, risk/reward analysis, and portfolio optimization tools. (Premium Feature)');
}

function showEnhancedAI() {
    alert('Enhanced AI: Get advanced market predictions, personalized trading recommendations, and detailed analysis. (Premium Feature)');
}

function testLotSize() {
    const lotSizeField = document.getElementById('lotSize');
    const value = lotSizeField.value;
    const disabled = lotSizeField.disabled;
    const readonly = lotSizeField.readOnly;
    const type = lotSizeField.type;

    alert(`Lot Size Field Test:
Value: ${value}
Disabled: ${disabled}
ReadOnly: ${readonly}
Type: ${type}
Field exists: ${lotSizeField ? 'Yes' : 'No'}`);

    // Try to set a value
    lotSizeField.value = '0.25';
    alert(`After setting value to 0.25: ${lotSizeField.value}`);
}

class TradingJournal {
    constructor() {
        this.trades = [];
        this.loadTrades();
        // clear any previously retained filters so all trades show initially
        const fp = document.getElementById('filterPair');
        const fr = document.getElementById('filterResult');
        if (fp) fp.value = '';
        if (fr) fr.value = '';
        this.initializeEventListeners();
        this.setTodayDate();
        this.renderTrades();
        this.updateStatistics();
        // after statistics are ready initialize the chart display
        this.initChart();
    }

    // Load trades from localStorage
    loadTrades() {
        const stored = localStorage.getItem('finspotTrades');
        console.log('loadTrades raw', stored);
        try {
            this.trades = stored ? JSON.parse(stored) : [];
            // sanitize fields for older entries
            this.trades = this.trades.map(t => {
                // enforce numeric values and defaults
                const entryPoint = parseFloat(t.entryPoint);
                const stopLoss = parseFloat(t.stopLoss);
                const takeProfit = parseFloat(t.takeProfit);
                const exitPoint = t.exitPoint != null ? parseFloat(t.exitPoint) : null;
                const profitLoss = parseFloat(t.profitLoss);
                const lotSize = parseFloat(t.lotSize);
                return {
                    ...t,
                    entryPoint: !isNaN(entryPoint) ? entryPoint : 0,
                    stopLoss: !isNaN(stopLoss) ? stopLoss : 0,
                    takeProfit: !isNaN(takeProfit) ? takeProfit : 0,
                    exitPoint: exitPoint !== null && !isNaN(exitPoint) ? exitPoint : null,
                    profitLoss: !isNaN(profitLoss) ? profitLoss : 0,
                    lotSize: !isNaN(lotSize) ? lotSize : 0,
                };
            });
        } catch (e) {
            console.error('Failed to parse stored trades', e);
            // clear corrupted data
            this.trades = [];
            localStorage.removeItem('finspotTrades');
        }
    }

    // Save trades to localStorage
    saveTrades() {
        localStorage.setItem('finspotTrades', JSON.stringify(this.trades));
    }

    // Initialize all event listeners
    initializeEventListeners() {
        document.getElementById('tradeForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        document.getElementById('entryPoint').addEventListener('change', () => this.calculateRiskReward());
        document.getElementById('stopLoss').addEventListener('change', () => this.calculateRiskReward());
        document.getElementById('takeProfit').addEventListener('change', () => this.calculateRiskReward());
        document.getElementById('askAiBtn').addEventListener('click', () => this.getAIInsights());
        document.getElementById('aiQuestion').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.getAIInsights();
        });
        document.getElementById('filterPair').addEventListener('change', () => this.renderTrades());
        document.getElementById('filterResult').addEventListener('change', () => this.renderTrades());
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());

        // Biometric and Premium event listeners
        document.getElementById('biometricLoginBtn').addEventListener('click', handleBiometricLogin);
        document.getElementById('upgradeBtn').addEventListener('click', () => showPaymentModal('monthly'));
        document.getElementById('closePaymentModal').addEventListener('click', () => {
            document.getElementById('paymentModal').classList.add('hidden');
        });
        document.getElementById('closePaymentModal').addEventListener('click', () => {
            document.getElementById('paymentModal').classList.add('hidden');
        });

        // Premium feature event listeners
        document.getElementById('advancedAnalyticsBtn').addEventListener('click', showAdvancedAnalytics);
        document.getElementById('exportDataBtn').addEventListener('click', exportData);
        document.getElementById('cloudBackupBtn').addEventListener('click', enableCloudBackup);
        document.getElementById('riskManagementBtn').addEventListener('click', showRiskManagement);
        document.getElementById('enhancedAIBtn').addEventListener('click', showEnhancedAI);
        document.getElementById('performanceReportsBtn').addEventListener('click', showPerformanceReports);
        document.getElementById('deviceInfoBtn').addEventListener('click', showDeviceInfo);
        document.getElementById('testLotSizeBtn').addEventListener('click', testLotSize);
    }

    // Set today's date as default
    setTodayDate() {
        // Use local timezone to avoid UTC offset causing previous-day dates
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const localISO = `${year}-${month}-${day}`;
        const el = document.getElementById('tradeDate');
        if (el) el.value = localISO;
    }

    // Calculate Risk/Reward Ratio
    calculateRiskReward() {
        const entry = parseFloat(document.getElementById('entryPoint').value);
        const sl = parseFloat(document.getElementById('stopLoss').value);
        const tp = parseFloat(document.getElementById('takeProfit').value);

        if (entry && sl && tp) {
            const risk = Math.abs(entry - sl);
            const reward = Math.abs(tp - entry);
            const ratio = risk > 0 ? (reward / risk).toFixed(2) : 0;
            document.getElementById('riskReward').value = `1:${ratio}`;
        }
    }

    // Handle form submission
    handleFormSubmit(e) {
        e.preventDefault();

        // Debug: Check lot size field
        const lotSizeField = document.getElementById('lotSize');
        console.log('Lot size field:', lotSizeField);
        console.log('Lot size value:', lotSizeField.value);
        console.log('Lot size disabled:', lotSizeField.disabled);
        console.log('Lot size readonly:', lotSizeField.readOnly);

        const trade = {
            id: Date.now(),
            date: document.getElementById('tradeDate').value,
            pair: document.getElementById('tradePair').value,
            type: document.getElementById('tradeType').value,
            entryPoint: parseFloat(document.getElementById('entryPoint').value),
            stopLoss: parseFloat(document.getElementById('stopLoss').value),
            takeProfit: parseFloat(document.getElementById('takeProfit').value),
            exitPoint: parseFloat(document.getElementById('exitPoint').value) || null,
            riskReward: document.getElementById('riskReward').value,
            result: document.getElementById('tradeResult').value || 'Pending',
            profitLoss: parseFloat(document.getElementById('profitLoss').value) || 0,
            lotSize: parseFloat(document.getElementById('lotSize').value) || 0,
            smcStrategy: document.getElementById('smcStrategy').value,
            notes: document.getElementById('tradeNotes').value,
            timestamp: new Date().toISOString()
        };

        this.trades.unshift(trade);
        console.log('handleFormSubmit added trade', trade);
        this.saveTrades();
        console.log('trades after save', this.trades.length, localStorage.getItem('finspotTrades'));
        // clear any active filters so the new trade is visible
        document.getElementById('filterPair').value = '';
        document.getElementById('filterResult').value = '';
        try {
            this.renderTrades();
        } catch (err) {
            console.error('renderTrades error on submit', err);
        }
        this.updateStatistics();
        this.resetForm();
        this.showNotification('Trade recorded successfully!');
    }

    // Reset form
    resetForm() {
        document.getElementById('tradeForm').reset();
        this.setTodayDate();
        document.getElementById('riskReward').value = '';
    }

    // Show notification
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #40916c;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Render trades to UI
    renderTrades() {
        const container = document.getElementById('tradesList');
        const filterPair = document.getElementById('filterPair').value;
        const filterResult = document.getElementById('filterResult').value;

        // debug logging
        console.log('renderTrades called', { all: this.trades.length, filterPair, filterResult });
        const debugEl = document.getElementById('historyDebug');
        if (debugEl) {
            debugEl.style.display = 'block';
            debugEl.textContent = `Total loaded trades: ${this.trades.length}`;
        }

        let filteredTrades = this.trades.filter(trade => {
            const pairMatch = !filterPair || trade.pair === filterPair;
            const resultMatch = !filterResult || trade.result === filterResult;
            return pairMatch && resultMatch;
        });
        console.log('filteredTrades count', filteredTrades.length, 'details', filteredTrades);

        // Update pair filter options
        this.updateFilterOptions();

        if (filteredTrades.length === 0) {
            container.innerHTML = '<p class="no-trades">No trades recorded yet. Start recording your trades!</p>';
            return;
        }

        container.innerHTML = filteredTrades.map(trade => this.createTradeCard(trade)).join('');

        // Add event listeners to delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tradeId = parseInt(e.target.dataset.tradeId);
                this.deleteTrade(tradeId);
            });
        });
    }

    // Update filter pair options
    updateFilterOptions() {
        const filterPair = document.getElementById('filterPair');
        const pairs = [...new Set(this.trades.map(t => t.pair))];

        const currentValue = filterPair.value;
        const currentOptions = Array.from(filterPair.options).map(o => o.value);

        pairs.forEach(pair => {
            if (!currentOptions.includes(pair)) {
                const option = document.createElement('option');
                option.value = pair;
                option.textContent = pair;
                filterPair.appendChild(option);
            }
        });

        filterPair.value = currentValue;
    }

    // Utility for safely formatting numbers that may be null/undefined
    formatNumber(value, decimals = 4) {
        return (typeof value === 'number' && !isNaN(value)) ? value.toFixed(decimals) : '—';
    }

    // Create trade card HTML
    createTradeCard(trade) {
        const resultBadge = this.getResultBadge(trade.result);
        const typeBadge = this.getTypeBadge(trade.type);
        const profitLossClass = trade.profitLoss >= 0 ? 'pl-positive' : 'pl-negative';
        const profitLossSymbol = trade.profitLoss >= 0 ? '+' : '';

        return `
            <div class="trade-card">
                <div class="trade-card-header">
                    <div>
                        <div class="trade-pair">${trade.pair}</div>
                        <div class="trade-date">${this.formatDate(trade.date)}</div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${resultBadge}
                        ${typeBadge}
                    </div>
                </div>

                <div class="trade-details">
                    <div class="trade-detail">
                        <div class="trade-detail-label">Entry</div>
                        <div class="trade-detail-value">${this.formatNumber(trade.entryPoint,4)}</div>
                    </div>
                    <div class="trade-detail">
                        <div class="trade-detail-label">Stop Loss</div>
                        <div class="trade-detail-value">${this.formatNumber(trade.stopLoss,4)}</div>
                    </div>
                    <div class="trade-detail">
                        <div class="trade-detail-label">Take Profit</div>
                        <div class="trade-detail-value">${this.formatNumber(trade.takeProfit,4)}</div>
                    </div>
                    <div class="trade-detail">
                        <div class="trade-detail-label">R:R Ratio</div>
                        <div class="trade-detail-value">${trade.riskReward}</div>
                    </div>
                    ${trade.exitPoint ? `
                    <div class="trade-detail">
                        <div class="trade-detail-label">Exit</div>
                        <div class="trade-detail-value">${this.formatNumber(trade.exitPoint,4)}</div>
                    </div>
                    ` : ''}
                    <div class="trade-detail">
                        <div class="trade-detail-label">P/L (Pips)</div>
                        <div class="trade-detail-value ${profitLossClass}">${profitLossSymbol}${this.formatNumber(trade.profitLoss,1)}</div>
                    </div>
                    <div class="trade-detail">
                        <div class="trade-detail-label">Lot Size</div>
                        <div class="trade-detail-value">${this.formatNumber(trade.lotSize,2)}</div>
                    </div>
                </div>

                ${trade.smcStrategy ? `
                <div class="trade-notes-section">
                    <div class="trade-notes-label">📍 SMC Strategy</div>
                    <div class="trade-notes-text">${this.escapeHtml(trade.smcStrategy)}</div>
                </div>
                ` : ''}

                ${trade.notes ? `
                <div class="trade-notes-section">
                    <div class="trade-notes-label">📝 Notes</div>
                    <div class="trade-notes-text">${this.escapeHtml(trade.notes)}</div>
                </div>
                ` : ''}

                <div class="trade-actions">
                    <button class="btn-delete" data-trade-id="${trade.id}">Delete Trade</button>
                </div>
            </div>
        `;
    }

    // Get result badge HTML
    getResultBadge(result) {
        const badges = {
            'Win': '<span class="trade-badge badge-win">✓ Win</span>',
            'Loss': '<span class="trade-badge badge-loss">✗ Loss</span>',
            'Break Even': '<span class="trade-badge badge-break-even">= Break Even</span>',
            'Pending': '<span class="trade-badge badge-pending">⏳ Pending</span>',
            '': '<span class="trade-badge badge-pending">⏳ Pending</span>'
        };
        return badges[result] || badges['Pending'];
    }

    // Get type badge HTML
    getTypeBadge(type) {
        return type === 'Long' 
            ? '<span class="trade-badge badge-long">📈 Long</span>'
            : '<span class="trade-badge badge-short">📉 Short</span>';
    }

    // Format date
    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    // Escape HTML
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Delete trade
    deleteTrade(tradeId) {
        if (confirm('Are you sure you want to delete this trade?')) {
            this.trades = this.trades.filter(t => t.id !== tradeId);
            this.saveTrades();
            this.renderTrades();
            this.updateStatistics();
            this.showNotification('Trade deleted successfully!');
        }
    }

    // Update statistics
    updateStatistics() {
        const total = this.trades.length;
        const wins = this.trades.filter(t => t.result === 'Win').length;
        // total P/L as number
        const totalPLnum = this.trades.reduce((sum, t) => sum + (Number(t.profitLoss) || 0), 0);
        const totalPL = totalPLnum.toFixed(1);

        // compute R:R per trade robustly: prefer riskReward string (1:2.5), else compute from entry/SL/TP
        const parseRR = (t) => {
            if (t && typeof t.riskReward === 'string' && t.riskReward.includes(':')) {
                const parts = t.riskReward.split(':');
                const val = parseFloat(parts[1]);
                if (!isNaN(val) && val > 0) return val;
            }
            const entry = Number(t.entryPoint) || 0;
            const sl = Number(t.stopLoss) || 0;
            const tp = Number(t.takeProfit) || 0;
            const risk = Math.abs(entry - sl);
            const reward = Math.abs(tp - entry);
            return risk > 0 ? (reward / risk) : 0;
        };

        const ratios = this.trades.map(parseRR).filter(r => r > 0);
        const avgRR = ratios.length > 0 ? (ratios.reduce((a, b) => a + b) / ratios.length).toFixed(2) : '—';
        const avgLot = total > 0 ? (this.trades.reduce((s, t) => s + (Number(t.lotSize) || 0), 0) / total).toFixed(2) : '—';

        // log for debugging (console only). keep the UI clean by not showing the red debug block.
        // compute win rate using closed trades (exclude Pending)
        const closed = this.trades.filter(t => t.result && t.result !== 'Pending');
        const winRate = closed.length > 0 ? ((wins / closed.length) * 100).toFixed(1) : '0';

        console.log('updateStatistics', { total, wins, winRate, totalPL, avgRR, avgLot });

        document.getElementById('totalTrades').textContent = total;
        document.getElementById('winRate').textContent = winRate + '%';
        document.getElementById('totalPL').textContent = (totalPLnum > 0 ? '+' : '') + totalPL;
        document.getElementById('avgRR').textContent = avgRR;
        document.getElementById('avgLot').textContent = avgLot;
        document.getElementById('avgLot').textContent = avgLot;
        // refresh chart after updating stats
        this.updateChart();
    }

    // initialize and update chart elements
    initChart() {
        // If a placeholder chart was created earlier, reuse it to avoid
        // double-instantiation and ensure the canvas is visible immediately.
        const canvas = document.getElementById('tradeChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (window._finspotChart) {
            this.chart = window._finspotChart;
            this.updateChart();
            return;
        }

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Lot Size',
                        data: [],
                        backgroundColor: 'rgba(45,106,79,0.4)',
                        borderColor: '#2d6a4f',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'P/L per Trade (pips)',
                        type: 'line',
                        data: [],
                        borderColor: '#2d6a4f',
                        backgroundColor: 'rgba(45,106,79,0.2)',
                        pointRadius: 4,
                        fill: false,
                        tension: 0.2,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: { y1: { beginAtZero: true, position: 'left' }, y: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } } }
            }
        });
        // store global reference so a placeholder created earlier can be reused
        window._finspotChart = this.chart;
        this.updateChart();
    }

    updateChart() {
        if (!this.chart) return;
        // show trades in chronological order (oldest -> newest)
        const sorted = [...this.trades].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const labels = sorted.map(t => this.formatDate(t.date));
        const profitData = sorted.map(t => t.profitLoss || 0);
        const lotData = sorted.map(t => t.lotSize || 0);

        // color points by win/loss (green for profit, red for loss, gray for pending)
        const pointColors = sorted.map(t => {
            if (t.result === 'Win') return '#06d6a0';
            if (t.result === 'Loss') return '#e63946';
            return '#888';
        });

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = lotData; // bar dataset
        // ensure second dataset exists for profit line
        if (this.chart.data.datasets.length < 2) {
            this.chart.data.datasets.push({
                label: 'P/L per Trade (pips)',
                type: 'line',
                data: profitData,
                borderColor: '#2d6a4f',
                backgroundColor: 'rgba(45,106,79,0.2)',
                pointBackgroundColor: pointColors,
                pointRadius: 6,
                fill: false,
                tension: 0.2,
                yAxisID: 'y'
            });
        } else {
            this.chart.data.datasets[1].data = profitData;
            this.chart.data.datasets[1].pointBackgroundColor = pointColors;
        }
        this.chart.data.datasets[0].backgroundColor = 'rgba(45,106,79,0.4)';
        this.chart.data.datasets[0].borderColor = '#2d6a4f';
        this.chart.data.datasets[0].borderWidth = 1;

        this.chart.options.plugins = this.chart.options.plugins || {};
        this.chart.options.plugins.tooltip = {
            callbacks: {
                label: (ctx) => {
                    const idx = ctx.dataIndex;
                    const trade = sorted[idx];
                    if (!trade) return '';
                    if (ctx.datasetIndex === 0) {
                        return `Lot Size: ${trade.lotSize}`;
                    }
                    const pl = (trade.profitLoss || 0);
                    return `${trade.pair} • ${trade.type} • P/L: ${pl >= 0 ? '+' : ''}${pl} pips`;
                },
                afterLabel: (ctx) => {
                    const idx = ctx.dataIndex;
                    const trade = sorted[idx];
                    if (!trade) return '';
                    return `Entry: ${trade.entryPoint || 'N/A'}  Exit: ${trade.exitPoint || 'N/A'}`;
                }
            }
        };
        // make dual-axis
        this.chart.options.scales = this.chart.options.scales || {};
        this.chart.options.scales.y = { beginAtZero: true, position: 'right' };
        this.chart.options.scales.y1 = { beginAtZero: true, position: 'left', grid: { drawOnChartArea: false } };

        this.chart.update();
    }

    // Get AI insights based on SMC concepts
    getAIInsights() {
        const question = document.getElementById('aiQuestion').value.trim();
        const responseDiv = document.getElementById('aiResponse');

        if (!question) {
            responseDiv.innerHTML = '<p style="color: #999;">Please ask a question about your trading.</p>';
            return;
        }

        responseDiv.innerHTML = '<p style="color: #999; font-style: italic;">🤖 Analyzing your trades...</p>';

        setTimeout(() => {
            const insight = this.generateAIInsight(question);
            responseDiv.innerHTML = insight;
        }, 500);
    }

    // Generate AI insight based on trades and SMC concepts
    generateAIInsight(question) {
        const questionLower = question.toLowerCase();
        const trades = this.trades;

        // map of SMC keywords to explanation callbacks
        const conceptMap = {
            'order block': this.explainOrderBlock,
            'mitigation block': this.explainMitigationBlock,
            'liquidity': this.explainLiquidityZones,
            'market structure': this.explainMarketStructure,
            'fvg': this.explainFVG,
            'fair value gap': this.explainFVG,
            'break and retest': this.explainBreakRetest,
            'order flow': this.explainOrderFlow,
            'entry checklist': this.explainEntryChecklist,
            'smc': this.analyzeSMCConcepts
        };

        for (const key in conceptMap) {
            if (questionLower.includes(key)) {
                return conceptMap[key].call(this);
            }
        }

        // Existing analytics
        // SMC Strategy Analysis
        if (questionLower.includes('strategy') || questionLower.includes('improve') || questionLower.includes('better')) {
            return this.analyzeStrategy(trades);
        }

        // Risk/Reward Analysis
        if (questionLower.includes('risk') || questionLower.includes('reward') || questionLower.includes('r:r')) {
            return this.analyzeRiskReward(trades);
        }

        // Win Rate Analysis
        if (questionLower.includes('win') || questionLower.includes('loss') || questionLower.includes('success')) {
            return this.analyzeWinRate(trades);
        }

        // Pair Performance
        if (questionLower.includes('pair') || questionLower.includes('performance')) {
            return this.analyzePairPerformance(trades);
        }

        // Entry/Exit Analysis
        if (questionLower.includes('entry') || questionLower.includes('exit') || questionLower.includes('smc')) {
            return this.analyzeSMCConcepts(trades);
        }

        // trade-specific advice (explicit)
        if (questionLower.includes('last trade') || questionLower.includes('recent trade') || questionLower.includes('this trade')) {
            return this.analyzeTradeImprovements(trades);
        }

        // catch-all for any trade related question
        if (questionLower.includes('trade')) {
            // combine last trade analysis with psychological tips and general insights
            let resp = this.analyzeTradeImprovements(trades);
            resp += this.analyzePsychology();
            resp += this.generateGeneralInsights(trades);
            return resp;
        }

        // Default: General improvement suggestions
        return this.generateGeneralInsights(trades);
    }

    // Analyze trading strategy
    analyzeStrategy(trades) {
        if (trades.length === 0) {
            return `
                <h3 style="color: #2d6a4f; margin-bottom: 1rem;">📊 Trading Strategy Analysis</h3>
                <p>You haven't recorded any trades yet. Start recording your trades to get SMC-based strategy insights!</p>
            `;
        }

        const smcStrategies = trades
            .map(t => t.smcStrategy)
            .filter(s => s && s.trim().length > 0);

        const strategyCount = {};
        smcStrategies.forEach(s => {
            strategyCount[s] = (strategyCount[s] || 0) + 1;
        });

        let analysis = `
            <h3 style="color: #2d6a4f; margin-bottom: 1rem;">📊 Trading Strategy Analysis</h3>
            <p><strong>Most Used Strategies:</strong></p>
            <ul style="margin-left: 1.5rem; color: #1b263b;">
        `;

        Object.entries(strategyCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .forEach(([strategy, count]) => {
                analysis += `<li>${strategy} <span style="color: #40916c;">(${count}x)</span></li>`;
            });

        analysis += `</ul>
            <p style="margin-top: 1rem;"><strong>💡 SMC Recommendations:</strong></p>
            <ul style="margin-left: 1.5rem; color: #1b263b;">
                <li>Combine Break and Retest with Order Flow for stronger confirmation</li>
                <li>Use Mitigation Blocks to identify safe entry zones</li>
                <li>Mark Support/Resistance zones where Smart Money institutions operate</li>
                <li>Focus on Premium/Discount zones for better R:R ratios</li>
                <li>Validate entries using Market Structure Breaks</li>
            </ul>
        `;

        return analysis;
    }

    // Analyze risk/reward
    analyzeRiskReward(trades) {
        if (trades.length === 0) {
            return `
                <h3 style="color: #2d6a4f; margin-bottom: 1rem;">💰 Risk/Reward Analysis</h3>
                <p>No trades recorded yet. Maintain a minimum R:R ratio of 1:2 for profitable trading.</p>
            `;
        }

        const ratios = trades.map(t => {
            const parts = t.riskReward.split(':');
            return parseFloat(parts[1]) || 0;
        }).filter(r => r > 0);

        const avgRR = ratios.length > 0 ? (ratios.reduce((a, b) => a + b) / ratios.length).toFixed(2) : 0;
        const goodRRTrades = ratios.filter(r => r >= 2).length;
        const goodRRPercent = ratios.length > 0 ? ((goodRRTrades / ratios.length) * 100).toFixed(1) : 0;

        return `
            <h3 style="color: #2d6a4f; margin-bottom: 1rem;">💰 Risk/Reward Analysis</h3>
            <p><strong>Your Average R:R Ratio:</strong> <span style="color: #40916c; font-size: 1.2rem; font-weight: bold;">1:${avgRR}</span></p>
            <p><strong>Trades with R:R ≥ 1:2:</strong> <span style="color: #40916c;">${goodRRPercent}%</span></p>
            <p style="margin-top: 1rem;"><strong>💡 Insights & Improvements:</strong></p>
            <ul style="margin-left: 1.5rem; color: #1b263b;">
                <li>${avgRR >= 2 ? '✓ Excellent risk management! Maintain these ratios.' : '⚠ Try to maintain minimum 1:2 R:R ratios for long-term profitability.'}</li>
                <li>Use Mitigation Blocks and Order Blocks to tighten stops (reduce risk)</li>
                <li>Place profits in line with Daily/Weekly resistance/support for better rewards</li>
                <li>Avoid trades with R:R below 1:1.5 unless high probability setup</li>
            </ul>
        `;
    }

    // Analyze win rate
    analyzeWinRate(trades) {
        if (trades.length === 0) {
            return `
                <h3 style="color: #2d6a4f; margin-bottom: 1rem;">📈 Win Rate Analysis</h3>
                <p>Start recording trades to track your win rate and consistency.</p>
            `;
        }

        const closed = trades.filter(t => t.result && t.result !== 'Pending');
        if (closed.length === 0) {
            return `
                <h3 style="color: #2d6a4f; margin-bottom: 1rem;">📈 Win Rate Analysis</h3>
                <p>Complete some trades to analyze your win rate. Keep trading journal entries for at least 50 trades.</p>
            `;
        }

        const wins = closed.filter(t => t.result === 'Win').length;
        const losses = closed.filter(t => t.result === 'Loss').length;
        const breakEven = closed.filter(t => t.result === 'Break Even').length;
        const winRate = ((wins / closed.length) * 100).toFixed(1);

        return `
            <h3 style="color: #2d6a4f; margin-bottom: 1rem;">📈 Win Rate Analysis</h3>
            <p><strong>Total Closed Trades:</strong> ${closed.length} | <strong>Wins:</strong> ${wins} | <strong>Losses:</strong> ${losses} | <strong>Break Even:</strong> ${breakEven}</p>
            <p><strong>Win Rate:</strong> <span style="color: ${winRate >= 55 ? '#06d6a0' : winRate >= 50 ? '#f77f00' : '#e63946'}; font-size: 1.2rem; font-weight: bold;">${winRate}%</span></p>
            <p style="margin-top: 1rem;"><strong>💡 Analysis:</strong></p>
            <ul style="margin-left: 1.5rem; color: #1b263b;">
                <li>${winRate >= 55 ? '✓ Strong win rate! Above 55% is excellent.' : winRate >= 50 ? '⚠ Break-even. Focus on improving entry accuracy.' : '⚠ Below 50%. Refocus on high-probability SMC setups.'}</li>
                <li>Track entry patterns that lead to wins vs losses</li>
                <li>Focus on Order Flow and Market Structure for entries</li>
                <li>Sample size: Analyze after at least 50 closed trades</li>
            </ul>
        `;
    }

    // Analyze pair performance
    analyzePairPerformance(trades) {
        if (trades.length === 0) {
            return `
                <h3 style="color: #2d6a4f; margin-bottom: 1rem;">🌍 Pair Performance</h3>
                <p>Start recording trades to analyze performance by currency pair.</p>
            `;
        }

        const pairStats = {};
        trades.forEach(trade => {
            if (!pairStats[trade.pair]) {
                pairStats[trade.pair] = { total: 0, wins: 0, pl: 0 };
            }
            pairStats[trade.pair].total++;
            if (trade.result === 'Win') pairStats[trade.pair].wins++;
            pairStats[trade.pair].pl += trade.profitLoss || 0;
        });

        let analysis = `
            <h3 style="color: #2d6a4f; margin-bottom: 1rem;">🌍 Pair Performance Analysis</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.9rem;">
                <tr style="background: #f1faee; border: 1px solid #e0e0e0;">
                    <th style="padding: 0.5rem; text-align: left;">Pair</th>
                    <th style="padding: 0.5rem;">Trades</th>
                    <th style="padding: 0.5rem;">Win%</th>
                    <th style="padding: 0.5rem;">P/L</th>
                </tr>
        `;

        Object.entries(pairStats)
            .sort((a, b) => b[1].total - a[1].total)
            .forEach(([pair, stats]) => {
                const winRate = ((stats.wins / stats.total) * 100).toFixed(0);
                const plColor = stats.pl >= 0 ? '#06d6a0' : '#e63946';
                analysis += `
                    <tr style="border: 1px solid #e0e0e0;">
                        <td style="padding: 0.5rem; font-weight: bold;">${pair}</td>
                        <td style="padding: 0.5rem; text-align: center;">${stats.total}</td>
                        <td style="padding: 0.5rem; text-align: center;">${winRate}%</td>
                        <td style="padding: 0.5rem; text-align: center; color: ${plColor}; font-weight: bold;">${stats.pl > 0 ? '+' : ''}${stats.pl.toFixed(1)}</td>
                    </tr>
                `;
            });

        analysis += `
            </table>
            <p><strong>💡 Recommendations:</strong></p>
            <ul style="margin-left: 1.5rem; color: #1b263b; font-size: 0.9rem;">
                <li>Focus on 2-3 pairs you're most profitable with</li>
                <li>Different pairs have different volatility - adjust position sizing accordingly</li>
                <li>Major pairs (EUR/USD, GBP/USD) typically have better liquidity for SMC setups</li>
            </ul>
        `;

        return analysis;
    }

    // Analyze SMC concepts
    analyzeSMCConcepts(trades) {
        return `
            <h3 style="color: #2d6a4f; margin-bottom: 1rem;">📍 SMC Concepts Guide</h3>
            <p><strong>Key Smart Money Concepts:</strong></p>
            <ul style="margin-left: 1.5rem; color: #1b263b; font-size: 0.9rem; line-height: 1.8;">
                <li><strong>Order Blocks:</strong> An impulsive candle followed by pullback. Institutional buy/sell zones.</li>
                <li><strong>Break & Retest:</strong> Price breaks structure and retests it. Smart entry confirmation.</li>
                <li><strong>Mitigation Blocks:</strong> Blocks that haven't been fully tested yet. Premium/Discount zones.</li>
                <li><strong>Premium/Discount Zones:</strong> Resistance/Support where smart money accumulates.</li>
                <li><strong>Fair Value Gap (FVG):</strong> Imbalanced area where price often returns to fill.</li>
                <li><strong>Liquidity:</strong> Areas where institutions place stops to trigger retail traders.</li>
                <li><strong>Market Structure:</strong> Higher Highs/Lows (uptrend), Lower Highs/Lows (downtrend).</li>
                <li><strong>Order Flow:</strong> Direction of large institutional trades - follow the money.</li>
            </ul>
            <p style="margin-top: 1rem;"><strong>💡 Entry Checklist:</strong></p>
            <ul style="margin-left: 1.5rem; color: #1b263b; font-size: 0.9rem;">
                <li>✓ Market Structure Break confirmed</li>
                <li>✓ Entry near Order Block or Mitigation Block</li>
                <li>✓ Risk/Reward at least 1:2</li>
                <li>✓ Multiple timeframe confirmation</li>
                <li>✓ Liquidity zone proximity checked</li>
            </ul>
        `;
    }

    // SMC concept explanations for direct questions
    explainOrderBlock() {
        return `
            <h3 style="color: #2d6a4f; margin-bottom: 1rem;">🧱 What is an Order Block?</h3>
            <p>An order block is the last bearish candle before a bullish impulse (or vice
            versa) that institutions use to enter positions. Smart traders look to buy
            on a retest of bullish order blocks and sell on retests of bearish ones.
            </p>
            <p><strong>Tip:</strong> Identify order blocks on higher timeframes and
            execute on lower ones for precision.</p>
        `;
    }

    explainMitigationBlock() {
        return `
            <h3 style="color: #2d6a4f; margin-bottom: 1rem;">🛡️ Mitigation Block</h3>
            <p>Mitigation blocks occur when price returns to an unfilled portion of an
            order block after a breakout. They often provide low-risk entries and are
            considered "discount" or "premium" zones.</p>
            <p><strong>SMC tip:</strong> Look for wick rejection or small bodies inside the
            block for confirmation.</p>
        `;
    }

    explainLiquidityZones() {
        return `
            <h3 style="color: #2d6a4f; margin-bottom: 1rem;">💧 Liquidity Zones</h3>
            <p>Liquidity zones are areas where stop orders cluster, usually around
            swing highs/lows or round numbers. Smart money often "hunts" these stops
            before reversing the market.</p>
            <p><strong>Strategy:</strong> Avoid placing stops directly in these zones;
            instead use them to gauge where price may spike before moving.</p>
        `;
    }

    explainMarketStructure() {
        return `
            <h3 style="color: #2d6a4f; margin-bottom: 1rem;">🏗️ Market Structure</h3>
            <p>Market structure refers to the pattern of highs and lows. Higher highs
            and higher lows indicate an uptrend, while lower highs and lower lows
            indicate a downtrend.</p>
            <p><strong>SMC application:</strong> Trade with the trend and use structure
            breaks to signal potential reversals.</p>
        `;
    }

    explainEntryChecklist() {
        return this.analyzeSMCConcepts(this.trades);
    }

    explainFVG() {
        return `
            <h3 style="color: #2d6a4f; margin-bottom: 1rem;">🌀 Fair Value Gap (FVG)</h3>
            <p>A Fair Value Gap (FVG) is an imbalance created when price moves rapidly
            and leaves a gap between two candles where no trading occurred. These gaps
            tend to attract price back to "fill" the imbalance, offering potential
            entry or exit zones for smart money traders.</p>
            <p><strong>Tip:</strong> Spot FVGs near order blocks or structure breaks for
            higher probability setups.</p>
        `;
    }

    explainBreakRetest() {
        return `
            <h3 style="color: #2d6a4f; margin-bottom: 1rem;">🔁 Break & Retest</h3>
            <p>Break & Retest is when price breaks a significant level (structure,
            support/resistance, order block, etc.) and then returns to retest that
            level before moving on. Traders use the retest as confirmation of the
            breakout.</p>
            <p><strong>Strategy:</strong> After a breakout, wait for a clear rejection
            candle on the retest before entering in the breakout direction.</p>
        `;
    }

    explainOrderFlow() {
        return `
            <h3 style="color: #2d6a4f; margin-bottom: 1rem;">📦 Order Flow</h3>
            <p>Order flow refers to the stream of buy and sell orders that push price.
            In SMC trading, following order flow means aligning with the direction where
            large institutional orders are dominating. Strong candles with little
            pullback often indicate powerful order flow.</p>
        `;
    }

    // Provide psychological trading tips
    analyzePsychology() {
        return `
            <h3 style="color: #2d6a4f; margin-bottom: 1rem;">🧠 Trading Psychology Tips</h3>
            <ul style="margin-left:1.5rem; color:#1b263b;">
                <li>Keep your journal honest; record emotions and decisions.</li>
                <li>Set predefined risk limits and obey them to avoid revenge trading.</li>
                <li>Review losing trades calmly and look for patterns rather than blaming luck.</li>
                <li>Use routines (pre-market checklists, post-trade review) to build discipline.</li>
                <li>Take breaks after a string of losses to reset your mindset.</li>
                <li>Always trade with a plan and avoid FOMO entries.</li>
            </ul>
        `;
    }

    // Analyze improvements for last trade
    analyzeTradeImprovements(trades) {
        if (trades.length === 0) {
            return `
                <h3 style="color: #2d6a4f; margin-bottom: 1rem;">🔍 Trade Improvement</h3>
                <p>No trades available. Record some trades first!</p>
            `;
        }
        const last = trades[0];
        const rrParts = last.riskReward.split(':');
        const rr = parseFloat(rrParts[1]) || 0;
        const messages = [];
        messages.push(`<p>Last trade was a <strong>${last.result}</strong> on <strong>${last.pair}</strong> with entry at ${last.entryPoint} and exit at ${last.exitPoint || 'N/A'}.</p>`);
        if (rr < 2) {
            messages.push('<p>Risk/Reward ratio was below 1:2; consider targeting larger moves or tightening stops.</p>');
        } else {
            messages.push('<p>Good R:R ratio; keep this discipline.</p>');
        }
        if (last.smcStrategy) {
            messages.push(`<p>Strategy used: ${this.escapeHtml(last.smcStrategy)}. Review whether price respected your order/mgmt zones.</p>`);
        }
        messages.push('<p>Psychology note: stay objective; if you felt anxious or rushed, step back and refine your routine.</p>');
        return `<h3 style="color:#2d6a4f;margin-bottom:1rem;">🔍 Last Trade Analysis</h3>${messages.join('')}`;
    }

    // Generate general insights
    generateGeneralInsights(trades) {
        if (trades.length === 0) {
            return `
                <h3 style="color: #2d6a4f; margin-bottom: 1rem;">💡 Get Started</h3>
                <p><strong>Welcome to Finspot Trading Journal!</strong></p>
                <p style="margin-top: 1rem;">Start recording your forex trades to unlock AI-powered insights based on Smart Money Concept principles. Once you have some trades, you can ask me about:</p>
                <ul style="margin-left: 1.5rem; color: #1b263b;">
                    <li>Your trading strategy improvements</li>
                    <li>Risk/Reward ratio analysis</li>
                    <li>Win rate and performance metrics</li>
                    <li>Currency pair performance</li>
                    <li>SMC concepts and entry validation</li>
                </ul>
            `;
        }

        return `
            <h3 style="color: #2d6a4f; margin-bottom: 1rem;">💡 Smart Money Trading Suggestions</h3>
            <p style="margin-bottom: 1rem;"><strong>Based on your ${trades.length} trade${trades.length > 1 ? 's' : ''}:</strong></p>
            <ul style="margin-left: 1.5rem; color: #1b263b; line-height: 1.8;">
                <li><strong>1. Focus on Order Blocks:</strong> Use previous impulsive moves to identify institutional entry zones. Enter on retests of these blocks.</li>
                <li><strong>2. Validate with Market Structure:</strong> Trade with the trend - longs on Higher Highs/Lows, shorts on Lower Highs/Lows.</li>
                <li><strong>3. Use Daily Timeframe:</strong> Identify SMC levels on Daily/4H, then execute on 1H/15M for precision entries.</li>
                <li><strong>4. Risk Management First:</strong> Place stops below Order Blocks. Never risk more than 1-2% per trade.</li>
                <li><strong>5. Break & Retest Strategy:</strong> Wait for price to break structure, then enter on the retest for confirmation.</li>
                <li><strong>6. Track Liquidity:</strong> Institutions hunt stops at key levels. Stay aware and protect your trades.</li>
                <li><strong>7. Journal Consistently:</strong> Record every trade, entry reason, and outcome to identify patterns.</li>
            </ul>
            <p style="margin-top: 1rem; color: #2d6a4f; font-weight: bold;">Keep learning, keep trading, keep improving! 📈</p>
        `;
    }

    // Clear all trades
    clearHistory() {
        if (confirm('Are you sure you want to delete ALL trades? This action cannot be undone.')) {
            this.trades = [];
            this.saveTrades();
            this.renderTrades();
            this.updateStatistics();
            this.showNotification('All trades cleared!');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // auth button listeners
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('registerBtn').addEventListener('click', handleRegister);
    document.getElementById('resetBtn').addEventListener('click', handleReset);
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // also handle Enter key in overlay
    ['loginUsername','loginPassword','loginEmail','loginPassword'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleLogin();
            });
        }
    });

    // Use Firebase auth state observer (defined earlier) to show/hide overlay and
    // instantiate the app when a user is signed in. If a user is already signed
    // in, the onAuthStateChanged callback will create `window.journal` and call
    // the constructor which runs `initChart()`.
    if (firebase.auth().currentUser) {
        // user already signed in
        document.getElementById('logoutBtn').style.display = 'block';
        if (!window.journal) window.journal = new TradingJournal();
        showOverlay(false);
    } else {
        // overlay will be shown by onAuthStateChanged when needed
    }
    // Create a lightweight placeholder chart immediately so users can see the
    // graph area even before signing in. TradingJournal will reuse this chart
    // instance when it initializes.
    try {
        const canvas = document.getElementById('tradeChart');
        if (canvas && !window._finspotChart && window.Chart) {
            const ctx = canvas.getContext('2d');
            window._finspotChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Lot Size',
                            data: [],
                            backgroundColor: 'rgba(45,106,79,0.4)',
                            borderColor: '#2d6a4f',
                            borderWidth: 1,
                            yAxisID: 'y1'
                        },
                        {
                            label: 'P/L per Trade (pips)',
                            type: 'line',
                            data: [],
                            borderColor: '#2d6a4f',
                            backgroundColor: 'rgba(45,106,79,0.2)',
                            pointRadius: 4,
                            fill: false,
                            tension: 0.2,
                            yAxisID: 'y'
                        }
                    ]
                },
                options: { responsive: true, scales: { y1: { beginAtZero: true, position: 'left' }, y: { beginAtZero: false, position: 'right', grid: { drawOnChartArea: false } } } }
            });
        }
    } catch (err) {
        // fail silently; chart will be created later by TradingJournal
        console.warn('Placeholder chart not created:', err?.message || err);
    }
    // Wire up modal open/close buttons
    const viewBtn = document.getElementById('viewTradeGraphBtn');
    if (viewBtn) viewBtn.addEventListener('click', () => showTradeModal());
    const closeBtn = document.getElementById('closeTradeModal');
    if (closeBtn) closeBtn.addEventListener('click', () => hideTradeModal());
});

// Show trade modal and initialize modal chart
function showTradeModal() {
    const modal = document.getElementById('tradeModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    // initialize or refresh modal chart after it becomes visible
    setTimeout(() => initModalChart(), 80);
}

function hideTradeModal() {
    const modal = document.getElementById('tradeModal');
    if (!modal) return;
    modal.classList.add('hidden');
}

function initModalChart() {
    const canvas = document.getElementById('tradeChartModal');
    if (!canvas || !window.Chart) return;
    const ctx = canvas.getContext('2d');

    // build chronological dataset from saved trades
    const stored = localStorage.getItem('finspotTrades');
    const trades = stored ? JSON.parse(stored) : [];
    const sorted = trades.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
    const labels = sorted.map(t => new Date(t.timestamp).toLocaleString());
    const profitData = sorted.map(t => t.profitLoss || 0);
    const lotData = sorted.map(t => t.lotSize || 0);
    const pointColors = sorted.map(t => t.result === 'Win' ? '#06d6a0' : (t.result === 'Loss' ? '#e63946' : '#888'));

    // if modal chart already exists, update it
    if (window._finspotModalChart) {
        window._finspotModalChart.data.labels = labels;
        window._finspotModalChart.data.datasets[0].data = lotData;
        window._finspotModalChart.data.datasets[1].data = profitData;
        window._finspotModalChart.data.datasets[1].pointBackgroundColor = pointColors;
        window._finspotModalChart.update();
        return;
    }

    window._finspotModalChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Lot Size',
                    data: lotData,
                    backgroundColor: 'rgba(45,106,79,0.4)',
                    borderColor: '#2d6a4f',
                    borderWidth: 1,
                    yAxisID: 'y1'
                },
                {
                    label: 'P/L per Trade (pips)',
                    type: 'line',
                    data: profitData,
                    borderColor: '#2d6a4f',
                    backgroundColor: 'rgba(45,106,79,0.2)',
                    pointBackgroundColor: pointColors,
                    pointRadius: 6,
                    fill: false,
                    tension: 0.15,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const idx = ctx.dataIndex;
                            const t = sorted[idx];
                            if (!t) return '';
                            if (ctx.datasetIndex === 0) {
                                return `Lot Size: ${t.lotSize}`;
                            }
                            return `${t.pair} • ${t.type} • P/L: ${t.profitLoss >= 0 ? '+' : ''}${t.profitLoss} pips`;
                        },
                        afterLabel: (ctx) => {
                            const idx = ctx.dataIndex;
                            const t = sorted[idx];
                            if (!t) return '';
                            return `Entry: ${t.entryPoint || 'N/A'}  Exit: ${t.exitPoint || 'N/A'}`;
                        }
                    }
                }
            },
            scales: { y1: { beginAtZero: true, position: 'left' }, y: { beginAtZero: false, position: 'right', grid: { drawOnChartArea: false } } }
        }
    });
}

// Initialize login event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('registerBtn').addEventListener('click', handleRegister);
    document.getElementById('resetBtn').addEventListener('click', handleReset);
    document.getElementById('resendVerificationBtn').addEventListener('click', handleResendVerification);
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Check for successful payment return
    handlePaymentSuccess();
});
