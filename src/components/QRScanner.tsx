import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface QRScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            false
        );

        scannerRef.current = scanner;

        scanner.render(
            (decodedText) => {
                onScan(decodedText);
                // Cleanup handled by parent closing the component which triggers unmount
            },
            (errorMessage) => {
                // console.log(errorMessage); // Ignore parse errors
            }
        );

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 relative">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-white font-medium">Escanear código QR</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <div className="p-4">
                    <div id="reader" className="overflow-hidden rounded-lg"></div>
                </div>
                <p className="text-center text-slate-400 text-sm pb-6 px-4">
                    Apunta tu cámara al código QR del destinatario
                </p>
            </div>
        </div>
    );
}
