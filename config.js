// config.js - Configuration file for Finspot Trading Journal
// IMPORTANT: Replace with your actual API keys for production

const config = {
    // Firebase Configuration
    firebase: {
        apiKey: "your-firebase-api-key",
        authDomain: "your-project.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project.appspot.com",
        messagingSenderId: "your-sender-id",
        appId: "your-app-id",
        measurementId: "your-measurement-id"
    },

    // Stripe Configuration
    stripe: {
        // TEST MODE (currently active - no real money)
        publishableKey: "pk_test_YOUR_ACTUAL_TEST_KEY_HERE", // Replace with your test key

        // LIVE MODE (uncomment when verified and ready for real payments)
        // publishableKey: "pk_live_YOUR_ACTUAL_LIVE_KEY_HERE", // Replace with your live key

        products: {
            premium_journal: {
                priceId: "price_YOUR_PRICE_ID_HERE", // From Stripe dashboard
                price: 9.99,
                interval: "month"
            }
        }
    },

    // App Configuration
    app: {
        name: "Trade Journal",
        version: "1.0.0",
        maxDevices: 2,
        premiumPlans: {
            monthly: {
                price: 9.99,
                interval: "month"
            },
            annual: {
                price: 99,
                interval: "year",
                savings: "17%"
            }
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else {
    window.appConfig = config;
}