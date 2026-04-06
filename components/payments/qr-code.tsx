"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  title?: string;
  description?: string;
  error?: string;
}

export function QRCodeDisplay({
  data,
  size = 200,
  title = "Scan to Pay",
  description = "Use your mobile banking app to scan this QR code",
  error,
}: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function generateQRCode() {
      if (!data) {
        setLoadError("No QR code data provided");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        // Use a public QR code API to generate the QR code
        // In production, you might want to use a library or generate server-side
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
        setQrCodeUrl(apiUrl);
        setIsLoading(false);
      } catch (err) {
        console.error("Error generating QR code:", err);
        setLoadError("Failed to generate QR code");
        setIsLoading(false);
      }
    }

    generateQRCode();
  }, [data, size]);

  if (error || loadError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <Alert variant="destructive">
            <AlertDescription>
              {error || loadError || "Failed to load QR code"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center p-6">
        {title && (
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
        )}
        {description && (
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {description}
          </p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center" style={{ width: size, height: size }}>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <img
              src={qrCodeUrl}
              alt="Payment QR Code"
              width={size}
              height={size}
              className="block"
              onError={() => {
                setLoadError("Failed to load QR code image");
                setIsLoading(false);
              }}
            />
          </div>
        )}

        {data && !isLoading && !loadError && (
          <div className="mt-4 text-xs text-muted-foreground text-center max-w-xs">
            <p className="font-mono break-all">{data}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}