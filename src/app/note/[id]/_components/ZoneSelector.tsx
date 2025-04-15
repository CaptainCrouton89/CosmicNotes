import { EntitySelector } from "@/components/ui/entity-selector";
import { getZoneOptions } from "@/lib/selector-options";
import { Zone } from "@/types/types";

interface ZoneSelectorProps {
  zone?: Zone;
  updating: boolean;
  onUpdateZone: (zone: Zone | undefined) => void;
  allowNull?: boolean;
}

export function ZoneSelector({
  zone,
  updating,
  onUpdateZone,
  allowNull = true,
}: ZoneSelectorProps) {
  return (
    <EntitySelector
      value={zone}
      options={getZoneOptions}
      updating={updating}
      onUpdateValue={onUpdateZone}
      allowNull={allowNull}
      placeholderLabel="Zone"
    />
  );
}
