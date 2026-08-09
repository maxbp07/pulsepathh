import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDepartment } from '@/lib/format';
import type { DashboardFilters } from '@/lib/api';

const SHIFT_OPTIONS = [
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night', label: 'Noche' },
];

export function FiltersBar({
  value,
  onChange,
  departments,
}: {
  value: DashboardFilters;
  onChange: (f: DashboardFilters) => void;
  departments: string[];
}) {
  const reset = () => onChange({});
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Departamento</Label>
        <Select
          value={value.department || 'all'}
          onValueChange={(v) => onChange({ ...value, department: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los departamentos</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {formatDepartment(d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Turno</Label>
        <Select
          value={value.shift || 'all'}
          onValueChange={(v) => onChange({ ...value, shift: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {SHIFT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Desde</Label>
        <Input
          type="date"
          className="w-[150px]"
          value={value.from || ''}
          onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Hasta</Label>
        <Input
          type="date"
          className="w-[150px]"
          value={value.to || ''}
          onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
        />
      </div>

      <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
        <RotateCcw className="h-4 w-4" /> Limpiar
      </Button>
    </div>
  );
}
