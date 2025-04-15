import { EntitySelector } from "@/components/ui/entity-selector";
import { getCategoryOptions } from "@/lib/selector-options";
import { Category } from "@/types/types";

interface CategorySelectorProps {
  category?: Category;
  updating: boolean;
  onUpdateCategory: (category: Category | undefined) => void;
  allowNull?: boolean;
}

export function CategorySelector({
  category,
  updating,
  onUpdateCategory,
  allowNull = true,
}: CategorySelectorProps) {
  return (
    <EntitySelector
      value={category}
      options={getCategoryOptions}
      updating={updating}
      onUpdateValue={onUpdateCategory}
      allowNull={allowNull}
      placeholderLabel="Category"
    />
  );
}
