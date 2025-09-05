import { auth } from "@/auth";
import { ArrayStorage } from "@/lib/arrayStorage";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await auth();
    if (!user?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const files = ArrayStorage.getFilesByUserId(user.user.id);
    
    // Return simplified file data for the frontend
    const fileData = files.map(file => ({
      id: file.id,
      name: file.name,
      summary: file.summary,
      chunkCount: file.chunks.length,
      createdAt: file.createdAt,
    }));

    return NextResponse.json({ files: fileData });
  } catch (error) {
    console.error("Get files error:", error);
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

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 });
    }

    const deleted = ArrayStorage.deleteFile(fileId, user.user.id);
    
    if (!deleted) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
