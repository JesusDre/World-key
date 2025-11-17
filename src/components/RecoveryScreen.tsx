import { useState } from "react";
import { ArrowLeft, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface RecoveryScreenProps {
  onBack: () => void;
}

export function RecoveryScreen({ onBack }: RecoveryScreenProps) {
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Ingresa el correo vinculado a tu cuenta");
      return;
    }

    setIsSubmitting(true);
    try {
      // En producción se llamaría al backend; por ahora solo mostramos una alerta amistosa.
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Solicitud enviada", {
        description: "Nuestro equipo revisará tus respuestas en los próximos minutos.",
      });
      setEmail("");
      setDetails("");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message ?? "No pudimos registrar tu solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      <div className="flex items-center gap-3 px-6 pt-10">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full border border-slate-800 hover:bg-slate-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Recuperar acceso</p>
          <h1 className="text-2xl font-semibold">Soporte WorldKey</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <Card className="w-full max-w-md bg-slate-900/70 border-slate-800 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-sm text-white">Verificación humana</p>
              <p className="text-xs text-slate-400">
                Comparte información básica y uno de nuestros guardianes revisará tu caso.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-slate-300 mb-1">Correo registrado</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@email.com"
                  className="pl-10 bg-slate-900 border-slate-800"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300 mb-1">Cuéntanos qué ocurrió</Label>
              <Textarea
                rows={4}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Incluye detalles sobre tu dispositivo, guardians u otra evidencia"
                className="bg-slate-900 border-slate-800 resize-none"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600"
          >
            {isSubmitting ? "Enviando…" : "Enviar solicitud"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
