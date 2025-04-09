import React from "react";

interface CosmicTag {
  tag: string;
  confidence: number;
  created_at: string;
}

interface NoteCardProps {
  note: {
    id: number;
    content: string;
    created_at: string;
    cosmic_tags?: CosmicTag[];
    category: string;
    zone: string;
  };
  onClick: (note: any) => void;
  formatDate: (dateString: string) => string;
  highlightedContent: React.ReactNode;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onClick,
  formatDate,
  highlightedContent,
}) => {
  return (
    <div
      className="p-5 border rounded-lg hover:border-green-400 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Note header with type and metadata */}
      <div className="flex justify-between mb-3">
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
          NOTE
        </span>
        <div className="flex space-x-2">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
            {note.category}
          </span>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-teal-100 text-teal-700">
            {note.zone}
          </span>
        </div>
      </div>

      {/* Tags section */}
      {note.cosmic_tags && note.cosmic_tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {note.cosmic_tags.map((tag: CosmicTag, tagIndex: number) => (
            <span
              key={tagIndex}
              className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
            >
              {tag.tag}
            </span>
          ))}
        </div>
      )}

      {/* Note content */}
      <div className="text-md mb-3 markdown">
        <div className="text-gray-800">{highlightedContent}</div>
      </div>

      {/* Footer with date */}
      <div className="text-sm text-gray-500">
        Created {formatDate(note.created_at)}
      </div>
    </div>
  );
};
