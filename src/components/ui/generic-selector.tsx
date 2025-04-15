import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";
import { ReactNode } from "react";

export interface SelectorOption<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
  colorClasses: string;
  menuIconComponent?: ReactNode;
}

export interface GenericSelectorProps<T extends string> {
  value?: T;
  options: SelectorOption<T>[];
  updating: boolean;
  onUpdateValue: (value: T | undefined) => void;
  allowNull?: boolean;
  nullLabel?: string;
  placeholderLabel?: string;
  placeholderIcon?: ReactNode;
}

export function GenericSelector<T extends string>({
  value,
  options,
  updating,
  onUpdateValue,
  allowNull = true,
  nullLabel = "Automatic",
  placeholderLabel = "Select",
  placeholderIcon,
}: GenericSelectorProps<T>) {
  // Find the selected option
  const selectedOption = value
    ? options.find((option) => option.value === value)
    : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-6 gap-1.5 px-2 flex items-center justify-center transition-all duration-300 ${
            selectedOption?.colorClasses || ""
          }`}
        >
          {updating ? (
            <div className="w-3 h-3 border-t-2 border-muted-foreground rounded-full animate-spin" />
          ) : selectedOption ? (
            <>
              {selectedOption.icon}
              <span className="hidden md:inline text-xs">
                {selectedOption.label}
              </span>
            </>
          ) : (
            <>
              {placeholderIcon}
              <span className="hidden md:inline text-xs">
                {placeholderLabel}
              </span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {allowNull && (
          <DropdownMenuItem onClick={() => onUpdateValue(undefined)}>
            <span className="ml-2 capitalize">{nullLabel}</span>
          </DropdownMenuItem>
        )}
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onUpdateValue(option.value)}
          >
            {option.menuIconComponent || option.icon}
            <span className="ml-2 capitalize">{option.label}</span>
            {value === option.value && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
