import { Beer, MapPin, Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message: string;
  subMessage?: string;
}

export function LoadingScreen({ message, subMessage }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-[2000]">
      <div className="relative mb-8">
        <Beer className="w-20 h-20 text-gold" />
        <div className="absolute -bottom-2 -right-2">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      </div>

      <h1 className="font-display text-4xl text-gold mb-2 tracking-wider">
        PINTS
      </h1>

      <p className="text-foreground font-medium">{message}</p>
      {subMessage && (
        <p className="text-sm text-muted-foreground mt-1">{subMessage}</p>
      )}
    </div>
  );
}
