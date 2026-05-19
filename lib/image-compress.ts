// Client-side image compression. Resize long edge to `maxEdge` and re-encode as
// JPEG at `quality`. Returns the original File untouched when:
//   - It's not a raster image we can decode (HEIC on Chrome, PDFs, etc.)
//   - The compressed output is no smaller than the input
//   - Canvas APIs aren't available (SSR / very old browsers)
//
// Always safe to call — caller falls back to the original file on any failure.

export type CompressOptions = {
  maxEdge?: number;
  quality?: number;
  skipUnder?: number;
};

const DEFAULTS: Required<CompressOptions> = {
  maxEdge: 2000,
  quality: 0.82,
  skipUnder: 350 * 1024
};

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const { maxEdge, quality, skipUnder } = { ...DEFAULTS, ...options };

  if (typeof document === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= skipUnder) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const longEdge = Math.max(bitmap.width, bitmap.height);
  const scale = longEdge > maxEdge ? maxEdge / longEdge : 1;
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (!blob) return file;
  if (blob.size >= file.size) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
}
