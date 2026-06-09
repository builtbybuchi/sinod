import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

interface QRCodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  isScanning: boolean;
  onToggleScanning: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScanSuccess,
  onScanError,
  isScanning,
  onToggleScanning,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const elementId = 'qr-reader';

  useEffect(() => {
    let mounted = true;
    
    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!mounted) return;
        
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available
          const backCamera = devices.find(
            (device) =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('rear')
          );
          const selectedCameraId = backCamera?.id || devices[0].id;
          setSelectedCamera(selectedCameraId);
        } else {
          setError('No cameras found on this device');
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError('Failed to access camera. Please grant camera permissions.');
      });

    return () => {
      mounted = false;
      // Clean up scanner when component unmounts
      const cleanup = async () => {
        if (scannerRef.current) {
          try {
            const state = scannerRef.current.getState();
            if (state === Html5QrcodeScannerState.SCANNING) {
              await scannerRef.current.stop();
            }
            await scannerRef.current.clear();
          } catch (err) {
            // Error cleaning up scanner
          }
        }
      };
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isScanning && selectedCamera) {
      startScanning();
    } else if (!isScanning && scannerRef.current) {
      stopScanning();
    }
  }, [isScanning, selectedCamera]);

  const startScanning = async () => {
    if (!selectedCamera) {
      setError('No camera selected');
      return;
    }

    try {
      setError(null);
      
      // Initialize scanner if not already created
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(elementId);
      }

      // Check if already scanning
      const currentState = scannerRef.current.getState();
      
      if (currentState === Html5QrcodeScannerState.SCANNING) {
        return;
      }

      // If scanner is in NOT_STARTED state but we have an old instance, clear it
      if (currentState === Html5QrcodeScannerState.NOT_STARTED) {
        try {
          await scannerRef.current.clear();
          scannerRef.current = new Html5Qrcode(elementId);
        } catch (err) {
          // No need to clear scanner
        }
      }

      setScanStatus('scanning');
      await scannerRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          setScanStatus('success');
          // Reset status after 2 seconds
          setTimeout(() => setScanStatus('scanning'), 2000);
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Suppress frequent scan errors (happens when no QR code is in view)
          // Only log significant errors
          if (!errorMessage.includes('No MultiFormat Readers') && 
              !errorMessage.includes('NotFoundException')) {
            setScanStatus('error');
            // Reset status after 2 seconds
            setTimeout(() => setScanStatus('scanning'), 2000);
          }
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to start camera');
      if (onScanError) {
        onScanError(err.message || 'Failed to start camera');
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        // Error stopping scanner
      }
    }
    setScanStatus('idle');
  };

  const handleCameraChange = async (cameraId: string) => {
    await stopScanning();
    setSelectedCamera(cameraId);
  };

  return (
    <div className="space-y-4">
      {/* Camera Selection */}
      {cameras.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-300">Camera:</label>
          <select
            value={selectedCamera}
            onChange={(e) => handleCameraChange(e.target.value)}
            disabled={isScanning}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scanner Container */}
      <div className="relative">
        <div
          id={elementId}
          className={`rounded-lg overflow-hidden border-4 transition-all duration-300 ${
            scanStatus === 'success'
              ? 'border-green-500 shadow-lg shadow-green-500/20'
              : scanStatus === 'error'
              ? 'border-red-500 shadow-lg shadow-red-500/20'
              : scanStatus === 'scanning'
              ? 'border-blue-500 shadow-lg shadow-blue-500/20'
              : 'border-gray-700'
          }`}
          style={{
            width: '100%',
            minHeight: isScanning ? '400px' : '200px',
          }}
        >
          {!isScanning && (
            <div className="flex items-center justify-center h-64 bg-gray-800/50">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-gray-500 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                <p className="text-gray-400">
                  {selectedCamera
                    ? 'Click "Start Scanning" to begin'
                    : 'No camera available'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Scanning Indicator */}
        {isScanning && (
          <div className={`absolute top-4 left-4 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
            scanStatus === 'success'
              ? 'bg-green-500/90'
              : scanStatus === 'error'
              ? 'bg-red-500/90'
              : 'bg-blue-500/90'
          }`}>
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                scanStatus === 'success'
                  ? 'bg-green-200 opacity-75'
                  : scanStatus === 'error'
                  ? 'bg-red-200 opacity-75'
                  : 'bg-white opacity-75'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                scanStatus === 'success'
                  ? 'bg-green-200'
                  : scanStatus === 'error'
                  ? 'bg-red-200'
                  : 'bg-white'
              }`}></span>
            </span>
            {scanStatus === 'success'
              ? 'QR Code Detected!'
              : scanStatus === 'error'
              ? 'Scan Error'
              : 'Scanning...'}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={onToggleScanning}
          disabled={!selectedCamera}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all shadow-lg ${
            isScanning
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold text-sm mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          How to use:
        </h4>
        <ul className="text-blue-200/80 text-sm space-y-1 list-disc list-inside">
          <li>Click "Start Scanning" to activate the camera</li>
          <li>Position the attendee's QR code within the camera view</li>
          <li>The system will automatically scan and verify the attendee</li>
          <li>A success message will appear when verification is complete</li>
        </ul>
      </div>
    </div>
  );
};

export default QRCodeScanner;
