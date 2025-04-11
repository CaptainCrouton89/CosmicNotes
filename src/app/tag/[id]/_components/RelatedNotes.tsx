import { Note } from "@/types/types";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RelatedNotesProps {
  notes: Note[] | undefined;
  isLoading: boolean;
  error: unknown;
}

export function RelatedNotes({ notes, isLoading, error }: RelatedNotesProps) {
  const router = useRouter();
  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 animate-pulse rounded"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Error loading related notes</p>
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return <p className="text-gray-500">No notes found in this cluster</p>;
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {notes.map((note) => (
        <div
          key={note.id}
          className="bg-white border rounded-lg overflow-hidden shadow cursor-pointer hover:shadow-lg transition-all duration-100"
          onClick={() => router.push(`/note/${note.id}`)}
        >
          <div className="p-4 border-b">
            <div className="text-sm text-gray-500">
              {format(new Date(note.created_at || ""), "MMM d, yyyy")}
            </div>
          </div>
          <div className="p-4">
            <p>{truncateContent(note.content || "")}</p>
            <div className="mt-4">
              <Link
                href={`/note/${note.id}`}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                View full note
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
