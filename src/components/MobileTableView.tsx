import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface MobileTableItem {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusVariant?: "default" | "secondary" | "destructive" | "outline";
  primaryValue: string;
  secondaryValue?: string;
  icon?: ReactNode;
  actions?: ReactNode[];
  metadata?: Array<{
    label: string;
    value: string;
  }>;
}

interface MobileTableViewProps {
  items: MobileTableItem[];
  emptyMessage?: string;
}

export function MobileTableView({ items, emptyMessage = "لا توجد عناصر" }: MobileTableViewProps) {
  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="p-4 shadow-soft hover:shadow-medium transition-shadow">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start gap-3">
              {item.icon && (
                <div className="flex-shrink-0 mt-0.5">
                  {item.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                {item.subtitle && (
                  <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                )}
              </div>
              <div className="flex-shrink-0 text-left">
                <p className="font-bold text-foreground">{item.primaryValue}</p>
                {item.secondaryValue && (
                  <p className="text-sm text-muted-foreground">{item.secondaryValue}</p>
                )}
              </div>
            </div>

            {/* Status and Metadata */}
            {(item.status || item.metadata) && (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.status && (
                    <Badge variant={item.statusVariant || "default"} className="text-xs">
                      {item.status}
                    </Badge>
                  )}
                  {item.metadata?.map((meta, index) => (
                    <div key={index} className="text-xs text-muted-foreground">
                      <span className="font-medium">{meta.label}:</span> {meta.value}
                    </div>
                  ))}
                </div>
                
                {/* Actions */}
                {item.actions && item.actions.length > 0 && (
                  <div className="flex items-center gap-1">
                    {item.actions.map((action, index) => (
                      <div key={index}>{action}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}