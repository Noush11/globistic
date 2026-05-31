"use client";

// Uploads a file to S3 via a presigned URL obtained from /api/uploads.
// Falls back to an in-browser data URL when cloud storage isn't configured
// (e.g. local development), so the customizer keeps working.
export async function uploadDesignFile(file: File): Promise<string> {
  try {
    const res = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type, folder: "artwork" })
    });
    const json = await res.json();
    if (json.success && json.data.uploadUrl) {
      const put = await fetch(json.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });
      if (put.ok) return json.data.publicUrl as string;
    }
  } catch {
    // ignore and fall back
  }
  return readAsDataUrl(file);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
