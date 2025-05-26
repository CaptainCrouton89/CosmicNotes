import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setActiveCategory } from "@/lib/redux/slices/clusterSlice";
import { capitalize } from "@/lib/utils";
import { CATEGORIES, Category } from "@/types/types";

interface TagHeaderProps {}

export function TagHeader({}: TagHeaderProps) {
  const dispatch = useAppDispatch();
  const { activeCategory, validNoteCategories } = useAppSelector(
    (state) => state.cluster
  );

  // Handle category change and update URL
  const handleCategoryChange = (category: Category) => {
    dispatch(setActiveCategory(category));
    const url = new URL(window.location.href);
    url.searchParams.set("category", category);
    window.history.replaceState({ path: url.href }, "", url.href);
  };

  return (
    <Tabs
      defaultValue={activeCategory || "scratchpad"}
      value={activeCategory || "scratchpad"}
      onValueChange={(value) => handleCategoryChange(value as Category)}
      className="w-full mb-2 md:mb-4 flex items-center"
    >
      <TabsList className="h-auto min-h-8 flex flex-wrap gap-1 pt-0.5 pb-0">
        {CATEGORIES.map((category) => (
          <TabsTrigger
            key={category}
            value={category}
            disabled={!validNoteCategories.includes(category)}
            className={`text-xs px-1 sm:px-2 md:px-3 lg:px-4 py-1 h-7 mb-1 ${
              activeCategory === category ? "font-semibold" : ""
            } ${
              !validNoteCategories.includes(category)
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            data-has-content={validNoteCategories.includes(category).toString()}
          >
            {capitalize(category)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
