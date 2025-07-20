#!/bin/bash

# Cleanup script for mobile testing temporary files

echo "🧹 GenStack Mobile Testing Cleanup"
echo ""
echo "This will remove temporary files added for mobile WebRTC testing."
echo ""
echo "Choose cleanup level:"
echo "1. Light cleanup (remove certificates and config files only)"
echo "2. Medium cleanup (+ remove standalone HTML test files)"  
echo "3. Full cleanup (+ remove React diagnostic components)"
echo "4. Cancel"
echo ""

read -p "Select option (1-4): " choice

case $choice in
    1)
        echo "🧹 Light cleanup - removing certificates and configs..."
        rm -f localhost-key.pem localhost.pem
        rm -f vite.config.https.ts vite.config.original.ts
        rm -f setup-https.sh switch-config.sh
        echo "✅ Light cleanup complete"
        ;;
    2)
        echo "🧹 Medium cleanup - removing certificates, configs, and HTML files..."
        rm -f localhost-key.pem localhost.pem
        rm -f vite.config.https.ts vite.config.original.ts
        rm -f setup-https.sh switch-config.sh
        rm -f mobile-*.html webrtc-*.html
        echo "✅ Medium cleanup complete"
        ;;
    3)
        echo "🧹 Full cleanup - removing all mobile testing additions..."
        rm -f localhost-key.pem localhost.pem
        rm -f vite.config.https.ts vite.config.original.ts  
        rm -f setup-https.sh switch-config.sh
        rm -f mobile-*.html webrtc-*.html
        rm -f src/components/WebRTCDiagnostic.tsx
        echo "⚠️  Note: You may need to remove WebRTCDiagnostic import from MobileTestPage.tsx"
        echo "✅ Full cleanup complete"
        ;;
    4)
        echo "❌ Cleanup cancelled"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📋 Remaining mobile improvements:"
echo "- Mobile-responsive React components (kept)"
echo "- Enhanced mobile layout (kept)"  
echo "- Original application functionality (restored)"
echo ""
echo "🚀 Your app should run normally now with: npm run dev"
