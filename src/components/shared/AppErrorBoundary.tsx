import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { hasError: true, message };
  }

  componentDidCatch() {
    // noop; React will log the error to console.
  }

  private hardReload = async () => {
    try {
      // Best-effort: unregister any SW that might have been installed previously.
      const regs = await navigator.serviceWorker?.getRegistrations?.();
      await Promise.all((regs || []).map((r) => r.unregister()));
    } catch {
      // ignore
    }

    // Force bypass cache.
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="font-display">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This can happen in preview if an old bundle is cached. Please do a hard refresh.
            </p>
            {this.state.message && (
              <pre className="text-xs whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3">
                {this.state.message}
              </pre>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => this.setState({ hasError: false, message: undefined })}>
                Try again
              </Button>
              <Button onClick={this.hardReload}>Hard refresh</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
