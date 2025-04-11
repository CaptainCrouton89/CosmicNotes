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

// Only import this to the next file
export default function InitializedMDXEditor({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  return (
    <MDXEditor
      plugins={[
        // headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        imagePlugin(),
        tablePlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <div className="flex items-center flex-wrap gap-2">
              {/* <BlockTypeSelect />
              <Separator /> */}
              <BoldItalicUnderlineToggles />
              <Separator />
              <ListsToggle options={["bullet", "number"]} />
              <Separator />
              <InsertTable />
            </div>
          ),
        }),
      ]}
      {...props}
      ref={editorRef}
    />
  );
}
