import { SelectorOption } from "@/components/ui/generic-selector";
import { Category, Zone } from "@/types/types";
import {
  Book,
  Briefcase,
  FolderKanban,
  Globe,
  GraduationCap,
  Home,
  Layers,
  Lightbulb,
  ListTodo,
  MessageSquare,
  Pencil,
  Search,
  Users,
} from "lucide-react";

// Placeholder icon for selectors
export const DefaultPlaceholderIcon = (
  <FolderKanban className="h-3 w-3 opacity-50" />
);

// Zone options configuration
export const getZoneOptions = (): SelectorOption<Zone>[] => [
  {
    value: "personal",
    label: "Personal",
    icon: <Home className="h-3.5 w-3.5" />,
    menuIconComponent: <Home className="mr-2 h-4 w-4 text-blue-600" />,
    colorClasses: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  {
    value: "work",
    label: "Work",
    icon: <Briefcase className="h-3.5 w-3.5" />,
    menuIconComponent: <Briefcase className="mr-2 h-4 w-4 text-green-600" />,
    colorClasses: "bg-green-50 text-green-700 hover:bg-green-100",
  },
  {
    value: "other",
    label: "Other",
    icon: <Globe className="h-3.5 w-3.5" />,
    menuIconComponent: <Globe className="mr-2 h-4 w-4 text-gray-600" />,
    colorClasses: "bg-gray-50 text-gray-700 hover:bg-gray-100",
  },
];

// Category options configuration
export const getCategoryOptions = (): SelectorOption<Category>[] => [
  {
    value: "to-do",
    label: "To-Do",
    icon: <ListTodo className="h-3.5 w-3.5" />,
    menuIconComponent: <ListTodo className="mr-2 h-4 w-4 text-blue-600" />,
    colorClasses: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  {
    value: "scratchpad",
    label: "Scratchpad",
    icon: <Pencil className="h-3.5 w-3.5" />,
    menuIconComponent: <Pencil className="mr-2 h-4 w-4 text-green-600" />,
    colorClasses: "bg-green-50 text-green-700 hover:bg-green-100",
  },
  {
    value: "collection",
    label: "Collection",
    icon: <Layers className="h-3.5 w-3.5" />,
    menuIconComponent: <Layers className="mr-2 h-4 w-4 text-pink-600" />,
    colorClasses: "bg-pink-50 text-pink-700 hover:bg-pink-100",
  },
  {
    value: "brainstorm",
    label: "Brainstorm",
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    menuIconComponent: <Lightbulb className="mr-2 h-4 w-4 text-yellow-600" />,
    colorClasses: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
  },
  {
    value: "journal",
    label: "Journal",
    icon: <Book className="h-3.5 w-3.5" />,
    menuIconComponent: <Book className="mr-2 h-4 w-4 text-purple-600" />,
    colorClasses: "bg-purple-50 text-purple-700 hover:bg-purple-100",
  },
  {
    value: "meeting",
    label: "Meeting",
    icon: <Users className="h-3.5 w-3.5" />,
    menuIconComponent: <Users className="mr-2 h-4 w-4 text-red-600" />,
    colorClasses: "bg-red-50 text-red-700 hover:bg-red-100",
  },
  {
    value: "research",
    label: "Research",
    icon: <Search className="h-3.5 w-3.5" />,
    menuIconComponent: <Search className="mr-2 h-4 w-4 text-teal-600" />,
    colorClasses: "bg-teal-50 text-teal-700 hover:bg-teal-100",
  },
  {
    value: "learning",
    label: "Learning",
    icon: <GraduationCap className="h-3.5 w-3.5" />,
    menuIconComponent: (
      <GraduationCap className="mr-2 h-4 w-4 text-indigo-600" />
    ),
    colorClasses: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  },
  {
    value: "feedback",
    label: "Feedback",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    menuIconComponent: (
      <MessageSquare className="mr-2 h-4 w-4 text-orange-600" />
    ),
    colorClasses: "bg-orange-50 text-orange-700 hover:bg-orange-100",
  },
];
