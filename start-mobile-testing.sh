#!/bin/bash

# GenStack Mobile Testing Setup Script
# This script starts both frontend and backend servers configured for mobile testing

echo "� Starting GenStack for Mobile Testing..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get current IP address
IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo -e "${BLUE}🔍 Detected IP Address: ${GREEN}$IP_ADDRESS${NC}"
echo ""

# Check if IP address was found
if [ -z "$IP_ADDRESS" ]; then
    echo -e "${RED}❌ Could not detect IP address. Please check your network connection.${NC}"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Trap cleanup on script exit
trap cleanup SIGINT SIGTERM

# Function to start backend
start_backend() {
    echo -e "${BLUE}🔧 Starting Backend Server...${NC}"
    cd backend
    npm run dev:watch > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Backend starting (PID: $BACKEND_PID)${NC}"
    
    # Wait for backend to be ready
    echo -e "${BLUE}⏳ Waiting for backend to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:5000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is ready!${NC}"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Backend failed to start within 30 seconds${NC}"
            cleanup
        fi
    done
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}🎨 Starting Frontend Server...${NC}"
    cd frontend
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Frontend starting (PID: $FRONTEND_PID)${NC}"
    
    # Wait for frontend to be ready
    echo -e "${BLUE}⏳ Waiting for frontend to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend is ready!${NC}"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Frontend failed to start within 30 seconds${NC}"
            cleanup
        fi
    done
}

# Start servers
start_backend
sleep 3
start_frontend

echo ""
echo -e "${YELLOW}🎉 GenStack Mobile Testing Ready!${NC}"
echo ""
echo -e "${YELLOW}📱 Access URLs:${NC}"
echo -e "   💻 Computer: ${GREEN}http://localhost:3000${NC}"
echo -e "   📱 Mobile:   ${GREEN}http://$IP_ADDRESS:3000${NC}"
echo ""
echo -e "${YELLOW}🔧 API Endpoints:${NC}"
echo -e "   💻 Computer: ${GREEN}http://localhost:5000${NC}"
echo -e "   📱 Mobile:   ${GREEN}http://$IP_ADDRESS:5000${NC}"
echo ""
echo -e "${YELLOW}🧪 Testing Features:${NC}"
echo "   ✅ WebSocket connections (fixed for mobile)"
echo "   ✅ WebRTC video calls (mobile compatible)"
echo "   ✅ Real-time collaboration"
echo "   ✅ All API endpoints"
echo ""
echo -e "${YELLOW}📝 Mobile Testing Instructions:${NC}"
echo "   1. Connect your mobile device to the same WiFi network"
echo "   2. Open your mobile browser (Chrome/Safari recommended)"
echo -e "   3. Navigate to: ${GREEN}http://$IP_ADDRESS:3000${NC}"
echo "   4. Register/Login with your account"
echo "   5. Test video calls and real-time features"
echo ""
echo -e "${YELLOW}🔍 Debugging:${NC}"
echo "   📋 Backend logs: tail -f backend.log"
echo "   📋 Frontend logs: tail -f frontend.log"
echo ""
echo -e "${YELLOW}🛑 To stop servers: Press Ctrl+C${NC}"
echo ""

# Generate QR code if qrencode is available
if command -v qrencode &> /dev/null; then
    echo -e "${BLUE}📱 QR Code for easy mobile access:${NC}"
    echo ""
    qrencode -t ansiutf8 "http://$IP_ADDRESS:3000"
    echo ""
fi

# Keep script running and show logs
echo -e "${BLUE}📊 Monitoring servers... (Press Ctrl+C to stop)${NC}"
echo ""

# Monitor server health
while true; do
    sleep 5
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend server stopped unexpectedly${NC}"
        cleanup
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend server stopped unexpectedly${NC}"
        cleanup
    fi
done
