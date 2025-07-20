import React from "react";
import MobileVideoTest from "../components/MobileVideoTest";
import SimpleMobileVideoTest from "../components/SimpleMobileVideoTest";
import WebRTCDiagnostic from "../components/WebRTCDiagnostic";

const MobileTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            📱 Mobile Video Diagnostics
          </h1>
          <p className="text-sm text-gray-600">
            Test mobile video functionality and diagnose issues
          </p>
        </div>

        {/* Add WebRTC Diagnostic first for quick status check */}
        <div className="mb-6">
          <WebRTCDiagnostic />
        </div>

        {/* Simple Mobile Test - New simplified version */}
        <div className="mb-6">
          <SimpleMobileVideoTest />
        </div>

        <div className="mb-6">
          <MobileVideoTest />
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h3 className="font-semibold text-green-900 mb-2 text-sm">
              🎉 Success! WebRTC Working
            </h3>
            <p className="text-xs text-green-800 mb-2">
              Great! Your mobile device supports WebRTC with HTTPS. You can now:
            </p>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Test the full video calling features in the main app</li>
              <li>• Join collaborative video sessions</li>
              <li>• Use screen sharing and recording features</li>
              <li>• Create and join project video calls</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">
              📋 Testing Instructions:
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Grant camera/microphone permissions when prompted</li>
              <li>• Try "Test Mobile Video" first</li>
              <li>• Check "Test Permissions" for detailed diagnostics</li>
              <li>• Review the debug log for specific error details</li>
              <li>• Use Chrome or Safari for best compatibility</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h3 className="font-semibold text-yellow-900 mb-2 text-sm">
              ⚠️ Common Issues:
            </h3>
            <ul className="text-xs text-yellow-800 space-y-1">
              <li>• "NotAllowedError" - Grant camera permissions</li>
              <li>• "NotFoundError" - No camera available</li>
              <li>• "NotReadableError" - Camera in use by another app</li>
              <li>• "OverconstrainedError" - Try lower quality settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTestPage;
