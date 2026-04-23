import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const SITE_URL = "https://lesjardinssurletoit.re";

const QRCodePage = () => {
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Toolbar — masquée à l'impression */}
      <div className="print:hidden w-full max-w-xl flex items-center justify-between mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="min-h-[44px]">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>
        <Button onClick={handlePrint} className="min-h-[44px]">
          <Printer className="h-4 w-4 mr-2" />
          Imprimer le QR Code
        </Button>
      </div>

      {/* Carte QR — seul élément imprimé */}
      <div className="print-area bg-card border border-border rounded-3xl p-8 md:p-12 shadow-xl text-center max-w-xl w-full">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/les-jardins-logo-circle.png" alt="Les Jardins Sur Le Toit" className="w-10 h-10 rounded-full object-cover" />
          <span className="font-display text-2xl font-bold text-foreground">
            Les Jardins Sur Le Toit
          </span>
        </div>
        <p className="text-muted-foreground text-sm mb-6 italic font-display">
          Food Court Rooftop · Saint-Gilles les Bains
        </p>

        <div className="inline-block p-5 rounded-2xl bg-white border-4 border-primary shadow-lg">
          <QRCodeSVG
            value={SITE_URL}
            size={260}
            level="H"
            fgColor="#2D5016"
            bgColor="#ffffff"
            includeMargin={false}
          />
        </div>

        <p className="mt-6 font-display text-lg font-bold text-foreground">
          Scannez pour découvrir notre carte
        </p>
        <p className="text-sm text-muted-foreground mt-1">{SITE_URL}</p>
      </div>

      {/* Styles d'impression : on n'imprime que la carte QR */}
      <style>{`
        @media print {
          @page { margin: 1.5cm; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default QRCodePage;
