import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Phone, MapPin, Percent, DollarSign } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { Partner } from "@/contexts/AppContext";
import NumericField from "@/components/NumericField";

export default function Partners() {
  const { partners, addPartner, updatePartner, deletePartner, getNetProfit } = useAppContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    partnershipPercentage: 0,
    openingBalance: 0,
  });

  const totalPercentage = (partners || []).reduce((sum, partner) => sum + (Number(partner?.partnershipPercentage) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من أن إجمالي النسب لا يتجاوز 100%
    const newTotal = editingPartner
      ? totalPercentage - editingPartner.partnershipPercentage + formData.partnershipPercentage
      : totalPercentage + formData.partnershipPercentage;
    
    if (newTotal > 100) {
      alert("إجمالي نسب الشراكة لا يمكن أن يتجاوز 100%");
      return;
    }

    if (editingPartner) {
      updatePartner({
        ...editingPartner,
        ...formData,
      });
    } else {
      addPartner(formData);
    }

    setIsDialogOpen(false);
    setEditingPartner(null);
    setFormData({
      name: "",
      phone: "",
      address: "",
      partnershipPercentage: 0,
      openingBalance: 0,
    });
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      phone: partner.phone,
      address: partner.address,
      partnershipPercentage: partner.partnershipPercentage,
      openingBalance: partner.openingBalance,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الشريك؟")) {
      deletePartner(id);
    }
  };

  const calculateProfitShare = (percentage: number, totalProfit: number) => {
    return (totalProfit * percentage) / 100;
  };

  // حساب الأرباح الإجمالية مربوطة مع لوحة التحكم
  const totalProfit = getNetProfit();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">إدارة الشركاء</h1>
          <p className="text-sm text-muted-foreground">إدارة شركاء المزرعة ونسب الأرباح</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">إضافة شريك</span>
          <span className="sm:hidden">شريك جديد</span>
        </Button>
      </div>

      {/* Partnership Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">إجمالي نسب الشراكة</p>
              <p className="text-lg sm:text-xl font-bold text-foreground">{totalPercentage}%</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-accent/10 rounded-lg flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">إجمالي الأرصدة الافتتاحية</p>
              <p className="text-lg sm:text-xl font-bold text-foreground truncate">
                {partners.reduce((sum, p) => sum + p.openingBalance, 0).toLocaleString()} جنيه
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-success/10 rounded-lg flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">الأرباح المتاحة للتوزيع</p>
              <p className="text-lg sm:text-xl font-bold text-foreground truncate">{totalProfit.toLocaleString()} جنيه</p>
            </div>
          </div>
        </Card>
      </div>

      {totalPercentage !== 100 && (
        <Card className="p-4 border-warning/20 bg-warning/5">
          <p className="text-warning">
            تحذير: إجمالي نسب الشراكة حالياً {totalPercentage}% - يجب أن تكون النسبة الإجمالية 100%
          </p>
        </Card>
      )}

      {/* Partners List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {partners.map((partner) => (
          <Card key={partner.id} className="p-4 sm:p-6 shadow-soft hover:shadow-medium transition-shadow">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground text-base sm:text-lg truncate">{partner.name}</h3>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {partner.partnershipPercentage}% شراكة
                  </Badge>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEdit(partner)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDelete(partner.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{partner.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">{partner.address}</span>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 border-t space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">الرصيد الافتتاحي:</span>
                  <span className="text-sm font-medium truncate">{partner.openingBalance.toLocaleString()} جنيه</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">نصيب من الأرباح:</span>
                  <span className="text-sm font-medium text-success truncate">
                    {calculateProfitShare(partner.partnershipPercentage, totalProfit).toLocaleString()} جنيه
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add/Edit Partner Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editingPartner ? "تعديل الشريك" : "إضافة شريك جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="name">اسم الشريك</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="address">العنوان</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="percentage">نسبة الشراكة (%)</Label>
              <NumericField
                id="percentage"
                value={formData.partnershipPercentage}
                onChangeNumber={(num) => setFormData(prev => ({ ...prev, partnershipPercentage: num }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="balance">الرصيد الافتتاحي (جنيه)</Label>
              <NumericField
                id="balance"
                value={formData.openingBalance}
                onChangeNumber={(num) => setFormData(prev => ({ ...prev, openingBalance: num }))}
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingPartner ? "تحديث" : "إضافة"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}