import { ApplicationError, UserError } from "@/lib/errors";
import { initializeServices } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// GET settings
export async function GET() {
  try {
    // Initialize services
    const { settingsService } = await initializeServices();

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UserError("User not found");
    }

    // Get settings using the service
    const settings = await settingsService.getSettings();

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return NextResponse.json(
        {
          error: err.message,
          data: err.data,
        },
        { status: 400 }
      );
    } else if (err instanceof ApplicationError) {
      console.error(`${err.message}: ${JSON.stringify(err.data)}`);
    } else {
      console.error(err);
    }

    return NextResponse.json(
      {
        error: "There was an error processing your request",
      },
      { status: 500 }
    );
  }
}

// PUT to update settings
export async function PUT(req: NextRequest) {
  try {
    const requestData = await req.json();

    if (!requestData) {
      throw new UserError("Missing request data");
    }

    // Initialize services
    const { settingsService } = await initializeServices();

    // Update settings using the service
    const updatedSettings = await settingsService.updateSettings(requestData);

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    });
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return NextResponse.json(
        {
          error: err.message,
          data: err.data,
        },
        { status: 400 }
      );
    } else if (err instanceof ApplicationError) {
      console.error(`${err.message}: ${JSON.stringify(err.data)}`);
    } else {
      console.error(err);
    }

    return NextResponse.json(
      {
        error: "There was an error processing your request",
      },
      { status: 500 }
    );
  }
}
