import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RiskBars } from './DepartmentBars';
import type { Segment, SegmentDimension } from '@/lib/types';
import { DIMENSION_LABELS } from '@/lib/format';

const DIMS: SegmentDimension[] = ['department', 'shift', 'gender', 'ageBand', 'tenureBand'];

/** Segmentación multidimensional en pestañas (dept / turno / género / edad / antigüedad). */
export function SegmentsTabs({ segments }: { segments: Record<SegmentDimension, Segment[]> }) {
  return (
    <Tabs defaultValue="shift" className="w-full">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
        {DIMS.map((d) => (
          <TabsTrigger
            key={d}
            value={d}
            className="data-[state=active]:bg-secondary data-[state=active]:text-foreground"
          >
            {DIMENSION_LABELS[d]}
          </TabsTrigger>
        ))}
      </TabsList>
      {DIMS.map((d) => (
        <TabsContent key={d} value={d} className="mt-4">
          <RiskBars items={segments[d] ?? []} dimension={d} asDepartment={d === 'department'} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
