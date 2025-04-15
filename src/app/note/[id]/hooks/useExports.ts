import { formatDateOnly } from "@/lib/utils";
import { CompleteNote } from "@/types/types";
import { MDXEditorMethods } from "@mdxeditor/editor";
import { RefObject, useCallback } from "react";

export const useExports = (
  editorRef: RefObject<MDXEditorMethods | null>,
  note?: CompleteNote
) => {
  const exportRawText = useCallback(() => {
    if (note?.content) {
      const blob = new Blob([note.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note?.title || "note"}.txt`;
      a.click();
    }
  }, [note?.content, note?.title]);

  const exportToPDF = useCallback(() => {
    if (!editorRef.current) return;

    // Get the HTML content from the editor
    const htmlContent = document.querySelector(
      'div[aria-label="editable markdown"]'
    )?.innerHTML;
    if (!htmlContent) return;

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to export PDF");
      return;
    }

    // Write a complete HTML document to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${note?.title || "Note"}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 16px;
          }
          .metadata {
            font-size: 12px;
            color: #666;
            margin-bottom: 24px;
          }
          .content {
            font-size: 14px;
          }
          
          /* List styling - keep browser defaults */
          ul {
            list-style-type: disc;
            padding-left: 1.5rem;
            margin-bottom: 1rem;
          }
          ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
            margin-bottom: 1rem;
          }
          li > ul {
            list-style-type: circle;
          }
          li {
            margin-top: 0;
            margin-bottom: 0;
          }
          li > ol {
            margin-bottom: 0.25rem;
          }
          
          /* Critical fix: hide bullets on list items that only contain nested lists */
          li:has(> ul:only-child),
          li:has(> ol:only-child) {
            list-style-type: none !important;
            padding-left: 0 !important;
            margin-left: 0 !important;
          }
          
          li:has(> input[type="checkbox"]) {
            list-style-type: none;
            margin-left: -1.5rem;
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
          }
          li:has(> input[type="checkbox"]) > input[type="checkbox"] {
            margin-top: 0.375rem;
          }
          
          /* Other content styling */
          code { 
            background: #f5f5f5; 
            padding: 2px 4px; 
            border-radius: 3px; 
            font-family: ui-monospace, monospace; 
          }
          
          pre { 
            background: #f5f5f5; 
            padding: 12px; 
            border-radius: 4px; 
            margin: 1em 0; 
            overflow-x: auto;
            font-family: ui-monospace, monospace;
          }
          
          blockquote { 
            border-left: 3px solid #e0e0e0; 
            margin: 1em 0; 
            padding-left: 1em; 
            color: #666; 
          }
          
          hr { 
            border: none; 
            border-top: 1px solid #e0e0e0; 
            margin: 1.5em 0; 
          }
          
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 1em 0; 
          }
          
          th, td { 
            border: 1px solid #e0e0e0; 
            padding: 8px; 
            text-align: left; 
          }
          
          img { 
            max-width: 100%; 
            height: auto;
            margin: 1em 0;
          }
          
          @media print {
            body {
              padding: 0;
            }
            @page {
              margin: 1cm;
            }
          }
        </style>
      </head>
      <body>
        <h1>${note?.title || "Note"}</h1>
        <div class="metadata">Last updated: ${
          note?.updated_at ? formatDateOnly(note.updated_at) : "N/A"
        }</div>
        <div class="content">${htmlContent}</div>
        <script>
          // Print and close after a short delay to ensure styles are applied
          setTimeout(() => {
            window.print();
            // Close the window after printing (or if print is canceled)
            setTimeout(() => window.close(), 100);
          }, 300);
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  }, [note?.title, note?.updated_at, editorRef]);

  return { exportRawText, exportToPDF };
};
