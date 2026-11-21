import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      sessionStorage.clear();
      window.location.href = "/";
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center select-none font-cairo"
          dir="rtl"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100">حدث خطأ غير متوقع أثناء العرض</h2>
              <p className="text-xs text-slate-400">
                تم منع انهيار البرنامج (الشاشة البيضاء) وحفظ أمان بياناتك المسجلة.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-right max-h-24 overflow-y-auto">
                <p className="text-[11px] font-mono text-rose-400 break-words" dir="ltr">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <Button
                onClick={this.handleReload}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة تحميل الصفحة
              </Button>

              <Button
                variant="outline"
                onClick={this.handleResetCache}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 h-11 rounded-xl flex items-center justify-center gap-2 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                تحديث الواجهة والرجوع للرئيسية
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
