import { formatDateOnly } from "@/lib/utils";
import { CompleteNote } from "@/types/types";
import { MDXEditorMethods } from "@mdxeditor/editor";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
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

    // Create a temporary container for PDF rendering
    const tempContainer = document.createElement("div");
    tempContainer.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 515.28px; // A4 width in points minus margins
      padding: 40px;
      background: white;
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      margin: 40px; // Add margin to the container
    `;

    // Add title
    const titleElement = document.createElement("h1");
    titleElement.style.cssText = `
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 16px;
      color: #000;
    `;
    titleElement.textContent = note?.title || "Note";
    tempContainer.appendChild(titleElement);

    // Add metadata (date)
    if (note?.updated_at) {
      const dateElement = document.createElement("div");
      dateElement.style.cssText = `
        font-size: 12px;
        color: #666;
        margin-bottom: 24px;
      `;
      dateElement.textContent = `Last updated: ${formatDateOnly(
        note.updated_at
      )}`;
      tempContainer.appendChild(dateElement);
    }

    // Add content
    const contentElement = document.createElement("div");
    contentElement.style.cssText = `
      font-size: 14px;
      color: #1a1a1a;
    `;
    contentElement.className = "markdown"; // Add markdown class for consistent styling

    // Get the HTML content from the editor
    const markdown = editorRef.current.getMarkdown();
    const htmlContent = document.querySelector(
      'div[aria-label="editable markdown"]'
    )?.innerHTML;
    if (htmlContent) {
      contentElement.innerHTML = htmlContent;

      // Style adjustments for content
      const styles = document.createElement("style");
      styles.textContent = `
        /* Base styles */
        h1, h2, h3, h4, h5, h6 { margin: 1.5em 0 0.5em; color: #000; }
        h1 { font-size: 20px; }
        h2 { font-size: 18px; }
        h3 { font-size: 16px; }
        p { margin: 0.8em 0; }
        
        /* List reset and base styles */
        ul, ol {
          margin: 0;
          padding: 0;
          list-style-position: outside;
        }
        
        /* First level list items */
        ul > li, ol > li {
          margin: 0.3em 0 0.3em 1.5em;
          padding-left: 0.5em;
        }
        
        /* First level lists */
        ul {
          list-style-type: disc;
        }
        
        ol {
          list-style-type: decimal;
        }
        
        /* Nested lists */
        li > ul,
        li > ol {
          margin: 0.2em 0 0.2em 0.5em;
        }
        
        li > ul > li {
          list-style-type: circle;
        }
        
        li > ul > li > ul > li {
          list-style-type: square;
        }
        
        /* Task list specific styling */
        li:has(> input[type="checkbox"]) {
          list-style: none !important;
          display: flex !important;
          align-items: flex-start !important;
          gap: 8px !important;
          margin-left: 0 !important;
          padding-left: 1.5em !important;
        }
        
        li:has(> input[type="checkbox"]) > input[type="checkbox"] {
          margin-top: 0.3em !important;
        }
        
        /* Other content styles */
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
      `;
      tempContainer.appendChild(styles);
    }

    tempContainer.appendChild(contentElement);
    document.body.appendChild(tempContainer);

    // Use html2canvas with improved settings
    html2canvas(tempContainer, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 515.28,
      onclone: (clonedDoc) => {
        // Fix list styling in the cloned document
        const clonedContent = clonedDoc.querySelector(".markdown");
        if (clonedContent) {
          // Ensure proper list display
          clonedContent.querySelectorAll("ul, ol").forEach((list) => {
            (list as HTMLElement).style.listStylePosition = "outside";
            (list as HTMLElement).style.paddingLeft = "0";
            (list as HTMLElement).style.marginLeft = "0";
          });

          // Fix list items
          clonedContent.querySelectorAll("li").forEach((li) => {
            if (!li.querySelector('input[type="checkbox"]')) {
              (li as HTMLElement).style.display = "list-item";
              (li as HTMLElement).style.marginLeft = "1.5em";
              (li as HTMLElement).style.paddingLeft = "0.5em";

              // Handle nested lists
              const parentList = li.parentElement;
              if (
                parentList &&
                parentList.parentElement &&
                parentList.parentElement.tagName === "LI"
              ) {
                (li as HTMLElement).style.marginLeft = "1em";
                if (parentList.tagName === "UL") {
                  (li as HTMLElement).style.listStyleType = "circle";
                }
              }
            }
          });
        }
      },
    }).then((canvas) => {
      try {
        // Create new jsPDF instance with better quality settings
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "a4",
          compress: true,
          hotfixes: ["px_scaling"],
        });

        // Calculate dimensions
        const imgWidth = 515.28;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const quality = 1.0; // Maximum quality for JPEG compression

        // Add the image to the PDF with improved quality
        pdf.addImage(
          canvas.toDataURL("image/jpeg", quality),
          "JPEG",
          40,
          40,
          515.28,
          imgHeight,
          undefined,
          "FAST"
        );

        // Handle multiple pages with improved quality
        if (imgHeight > 761.89) {
          let remainingHeight = imgHeight;
          let currentPosition = 761.89;

          while (remainingHeight > 761.89) {
            pdf.addPage();
            pdf.addImage(
              canvas.toDataURL("image/jpeg", quality),
              "JPEG",
              40,
              -currentPosition + 40,
              515.28,
              imgHeight,
              undefined,
              "FAST"
            );
            remainingHeight -= 761.89;
            currentPosition += 761.89;
          }
        }

        // Save the PDF
        pdf.save(`${note?.title || "note"}.pdf`);
      } catch (error) {
        console.error("Error creating PDF:", error);
      } finally {
        // Clean up: remove the temporary container
        document.body.removeChild(tempContainer);
      }
    });
  }, [note?.title, note?.updated_at, editorRef]);

  return { exportRawText, exportToPDF };
};
