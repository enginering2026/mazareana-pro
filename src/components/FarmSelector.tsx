import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus, Building2 } from "lucide-react";

interface FarmSelectorProps {
  onAddFarm?: () => void;
}

export const FarmSelector = ({ onAddFarm }: FarmSelectorProps) => {
  const { currentFarm, farms, setCurrentFarm } = useAppContext();

  const handleFarmChange = (farmId: string) => {
    const farm = farms.find(f => f.id === farmId);
    if (farm) {
      setCurrentFarm(farm);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Select 
        value={currentFarm?.id} 
        onValueChange={handleFarmChange}
      >
        <SelectTrigger className="h-8 px-2.5 sm:px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition rounded-full text-[11px] font-semibold text-slate-700 dark:text-slate-200 border-none shadow-none focus:ring-0 focus:ring-offset-0 gap-1.5">
          <div className="flex items-center gap-1.5 max-w-[130px] sm:max-w-[180px] truncate">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <SelectValue placeholder="اختر المزرعة" />
          </div>
        </SelectTrigger>
        <SelectContent align="end" className="rounded-xl shadow-lg border-slate-200 dark:border-slate-800">
          {farms.map((farm) => (
            <SelectItem key={farm.id} value={farm.id} className="text-xs py-2 cursor-pointer">
              <span className="font-medium">{farm.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {onAddFarm && (
        <Button 
          variant="outline" 
          size="icon"
          onClick={onAddFarm}
          className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0 shadow-none"
          title="إضافة مزرعة جديدة"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};