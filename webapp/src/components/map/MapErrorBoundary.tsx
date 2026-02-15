import { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("[PINTS] Map failed to load:", error.message, error);
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message ?? "Unknown error";
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/95 p-6">
          <AlertCircle className="w-12 h-12 text-gold" />
          <p className="text-foreground text-center text-sm">
            Map couldn&apos;t load. You can still browse venues using the card below.
          </p>
          <p className="text-muted-foreground text-xs font-mono max-w-full truncate px-4" title={msg}>
            {msg}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
