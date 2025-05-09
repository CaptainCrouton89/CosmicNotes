"use client";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  headingsPlugin,
  imagePlugin,
  InsertTable,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  Separator,
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
        markdownShortcutPlugin(),
        headingsPlugin({
          allowedHeadingLevels: [1, 2, 3, 4],
        }),
        imagePlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <div>
              {createPortal(
                <div className="flex items-center flex-wrap gap-2">
                  <BlockTypeSelect />
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
