import { ITEM_CATEGORIES } from "@/lib/constants";
import { ApplicationError, UserError } from "@/lib/errors";
import { initializeServices } from "@/lib/services";
import { Category, Item, Note, Zone } from "@/types/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const requestData = await req.json();

    if (!requestData) {
      throw new UserError("Missing request data");
    }

    // Initialize services with proper dependency setup
    const { noteService, itemService } = await initializeServices();
    const savedNote: Note = await noteService.createNote(requestData);
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
    const limit = parseInt(url.searchParams.get("limit") || "0");
    const category = url.searchParams.get("category") || null;
    const zone = url.searchParams.get("zone") || null;
    const fetchAll = url.searchParams.get("fetchAll") === "true";

    const { noteService } = await initializeServices();

    if (category && fetchAll) {
      const notes = await noteService.getNotesByCategory(category as Category);
      // Return full notes, not simplified, and not paginated
      return NextResponse.json(notes);
    }

    // Calculate offset based on page and limit
    const offset = (page - 1) * limit;
    // Fetch notes and totalCount from the service
    const { notes, totalCount } = await noteService.getNotes(
      offset,
      limit,
      category as Category,
      zone as Zone
    );

    // Calculate totalPages and hasMore
    const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 1; // Avoid division by zero if limit is 0
    const hasMore = limit > 0 ? page < totalPages : false;

    const simplifiedNotes = notes.map((note) => {
      return {
        id: note.id,
        title: note.title,
        category: note.category,
        updated_at: note.updated_at,
        created_at: note.created_at,
        tags: note.tags,
        zone: note.zone,
      };
    });

    // Structure the response to match PaginatedResponse<Note>
    return NextResponse.json({
      content: simplifiedNotes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore,
      },
    });
  } catch (err: unknown) {
    console.error("Error fetching notes:", err);
    return NextResponse.json(
      { error: "There was an error processing your request" },
      { status: 500 }
    );
  }
}
