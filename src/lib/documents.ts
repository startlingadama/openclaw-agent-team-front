// Helpers for the files produced by the writer agent (Markdown, LaTeX source, PDF).
import { FileCode, FileText, FileType } from "lucide-react";
import { toast } from "sonner";
import { api, type DocumentFile, type DocumentKind } from "@/lib/api";

export const KIND_LABEL: Record<DocumentKind, string> = {
  md: "Markdown",
  tex: "LaTeX",
  pdf: "PDF",
};

export const KIND_ICON: Record<DocumentKind, typeof FileText> = {
  md: FileText,
  tex: FileCode,
  pdf: FileType,
};

export function kindOf(path: string): DocumentKind | undefined {
  const extension = path.split(".").pop()?.toLowerCase();
  return extension === "md" || extension === "tex" || extension === "pdf" ? extension : undefined;
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export type DocumentGroup = { folder: string; modified: string; files: DocumentFile[] };

/** Groups files by document folder, in order of first appearance (the list is newest first). */
export function groupByFolder(files: DocumentFile[]): DocumentGroup[] {
  const groups = new Map<string, DocumentGroup>();
  for (const file of files) {
    const group = groups.get(file.folder);
    if (group) group.files.push(file);
    else groups.set(file.folder, { folder: file.folder, modified: file.modified, files: [file] });
  }
  return [...groups.values()];
}

/**
 * Saves a document. The download needs the session token, so a plain link cannot be used:
 * the file is fetched with the Authorization header and saved from an object URL.
 */
export async function downloadDocument(file: Pick<DocumentFile, "path" | "name">) {
  try {
    const blob = await api.documents.blob(file.path);
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.rel = "noopener";
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } catch (error) {
    toast.error("Download failed", { description: (error as Error).message });
  }
}
