import { auth } from "@/auth";
import { ArrayStorage } from "@/lib/arrayStorage";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await auth();
    if (!user?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = ArrayStorage.getStats();
    const userFiles = ArrayStorage.getFilesByUserId(user.user.id);

    return NextResponse.json({
      stats,
      userFileCount: userFiles.length,
      totalFiles: stats.fileCount,
      totalChunks: stats.chunkCount,
    });
  } catch (error) {
    console.error("Storage stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await auth();
    if (!user?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow clearing in development
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Not allowed in production" },
        { status: 403 }
      );
    }

    ArrayStorage.clearAll();
    
    return NextResponse.json({ 
      success: true, 
      message: "All storage cleared" 
    });
  } catch (error) {
    console.error("Clear storage error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
