import {
  GenericSelector,
  SelectorOption,
} from "@/components/ui/generic-selector";
import { DefaultPlaceholderIcon } from "@/lib/selector-options";
import { ReactNode, useMemo } from "react";

export interface EntitySelectorProps<T extends string> {
  value?: T;
  options: SelectorOption<T>[] | (() => SelectorOption<T>[]);
  updating: boolean;
  onUpdateValue: (value: T | undefined) => void;
  allowNull?: boolean;
  nullLabel?: string;
  placeholderLabel?: string;
  placeholderIcon?: ReactNode;
}

/**
 * A flexible entity selector component that can be used for any type of entity
 * that needs to be selected from a dropdown
 */
export function EntitySelector<T extends string>({
  value,
  options,
  updating,
  onUpdateValue,
  allowNull = true,
  nullLabel = "Automatic",
  placeholderLabel = "Select",
  placeholderIcon = DefaultPlaceholderIcon,
}: EntitySelectorProps<T>) {
  // Handle both direct options array and function that returns options
  const resolvedOptions = useMemo<SelectorOption<T>[]>(() => {
    return typeof options === "function" ? options() : options;
  }, [options]);

  return (
    <GenericSelector
      value={value}
      options={resolvedOptions}
      updating={updating}
      onUpdateValue={onUpdateValue}
      allowNull={allowNull}
      nullLabel={nullLabel}
      placeholderLabel={placeholderLabel}
      placeholderIcon={placeholderIcon}
    />
  );
}
