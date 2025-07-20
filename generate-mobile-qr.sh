#!/bin/bash

# Generate QR Code for mobile access
# Requires qrencode: brew install qrencode

IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
URL="http://$IP_ADDRESS:3000"

echo "🔗 Mobile Access URL: $URL"
echo ""

# Check if qrencode is installed
if command -v qrencode &> /dev/null; then
    echo "📱 QR Code for mobile access:"
    echo ""
    qrencode -t ansiutf8 "$URL"
    echo ""
    echo "Scan this QR code with your mobile device to open GenStack!"
else
    echo "💡 Install qrencode to generate QR codes:"
    echo "   brew install qrencode"
    echo ""
    echo "Then run this script again to get a QR code for easy mobile access!"
fi

echo ""
echo "📱 Manual URL: $URL"
