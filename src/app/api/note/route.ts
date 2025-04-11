import { ApplicationError, UserError } from "@/lib/errors";
import { initializeServices } from "@/lib/services";
import { Category, Item, Note } from "@/types/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const ITEM_CATEGORIES: Category[] = [
  "to-do",
  "brainstorm",
  "collection",
  "feedback",
];

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const requestData = await req.json();

    if (!requestData) {
      throw new UserError("Missing request data");
    }

    // Initialize services with proper dependency setup
    const { noteService, itemService } = await initializeServices();
    const savedNote = await noteService.createNote(requestData);
    if (ITEM_CATEGORIES.includes(savedNote.category)) {
      const items: Item[] = await itemService.saveNoteAsItems(
        savedNote,
        savedNote.category
      );
      return NextResponse.json({ ...savedNote, items } as Note);
    }
    return NextResponse.json(savedNote);
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    } else if (err instanceof ApplicationError) {
      console.error(`${err.message}: ${JSON.stringify(err.data)}`);
    } else {
      console.error(err);
    }

    return NextResponse.json(
      { error: "There was an error processing your request" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    // Calculate offset based on page and limit
    const offset = (page - 1) * limit;
    const { noteService } = await initializeServices();
    const notes = await noteService.getNotes(offset, limit);
    const totalPages = Math.ceil(notes.length / limit);

    return NextResponse.json({
      content: notes,
      page,
      limit,
      totalPages,
    });
  } catch (err: unknown) {
    console.error("Error fetching notes:", err);
    return NextResponse.json(
      { error: "There was an error processing your request" },
      { status: 500 }
    );
  }
}
