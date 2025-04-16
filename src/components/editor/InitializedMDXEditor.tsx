"use client";
import {
  BoldItalicUnderlineToggles,
  imagePlugin,
  InsertTable,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  Separator,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  type MDXEditorMethods,
  type MDXEditorProps,
} from "@mdxeditor/editor";
import type { ForwardedRef } from "react";
import { createPortal } from "react-dom";

// Only import this to the next file
export default function InitializedMDXEditor({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  return (
    <MDXEditor
      plugins={[
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        imagePlugin(),
        tablePlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <div>
              {createPortal(
                <div className="flex items-center flex-wrap gap-2">
                  <BoldItalicUnderlineToggles />
                  <Separator />
                  <ListsToggle options={["bullet", "number"]} />
                  <Separator />
                  <InsertTable />
                </div>,
                document.body.querySelector(".toolbar-head") || document.body
              )}
            </div>
          ),
        }),
      ]}
      {...props}
      ref={editorRef}
    />
  );
}
