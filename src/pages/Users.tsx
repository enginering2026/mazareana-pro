import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useAppContext } from "@/contexts/AppContext";
import { Navigate } from "react-router-dom";
import { Users as UsersIcon, ShieldCheck, HardHat, Loader2 } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'worker';
  farms_count: number;
}

export default function Users() {
  const { isAdmin, user: currentUser, loading: authLoading } = useAuth();
  const { farms } = useAppContext();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setUsers([
      {
        id: "local-user",
        email: "admin@local.com",
        full_name: "المدير",
        role: "admin",
        farms_count: farms.length
      }
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, farms.length]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const adminsCount = users.filter((u) => u.role === "admin").length;
  const workersCount = users.filter((u) => u.role === "worker").length;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <UsersIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">إدارة المستخدمين</h1>
          <p className="text-sm text-muted-foreground">
            تحكّم في صلاحيات العاملين والمالكين على المزارع (وضع العمل المحلي)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">المالكون</p>
            <p className="text-2xl font-bold">{adminsCount}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <HardHat className="h-8 w-8 text-accent" />
          <div>
            <p className="text-sm text-muted-foreground">العاملون</p>
            <p className="text-2xl font-bold">{workersCount}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-display font-semibold">قائمة المستخدمين</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">لا يوجد مستخدمون</p>
        ) : (
          <div className="divide-y">
            {users.map((u) => {
              const isMe = u.id === currentUser?.id;
              return (
                <div
                  key={u.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-10 w-10 rounded-full grid place-items-center font-bold text-white bg-primary"
                    >
                      {(u.full_name || u.email)[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">
                          {u.full_name || u.email.split("@")[0]}
                        </p>
                        {isMe && <Badge variant="secondary">أنت</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="default"
                    >
                      مالك / مدير
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4 bg-muted/30 border-dashed">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">وضع العمل المحلي:</strong> التطبيق مهيأ للعمل بالكامل محلياً على هذا الجهاز بدون مزامنة خارجية مع خوادم أخرى.
        </p>
      </Card>
    </div>
  );
}
