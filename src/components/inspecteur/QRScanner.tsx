import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner = ({ onScanSuccess, onClose }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScanSuccess(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Ignore continuous scan errors
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Error starting QR scanner:", err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Scanner le QR Code</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              stopScanner();
              onClose();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />

        <p className="text-sm text-muted-foreground mt-4 text-center">
          Positionnez le QR code dans le cadre
        </p>
      </CardContent>
    </Card>
  );
};
