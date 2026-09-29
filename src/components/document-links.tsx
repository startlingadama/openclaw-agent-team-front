import { Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { DocumentFile } from "@/lib/api";
import { downloadDocument, formatBytes, KIND_ICON, KIND_LABEL } from "@/lib/documents";

/** The files a task produced, each one downloadable and openable in the Documents page. */
export function DocumentLinks({ documents }: { documents: DocumentFile[] }) {
  const [downloading, setDownloading] = useState<string>();

  async function download(file: DocumentFile) {
    setDownloading(file.path);
    await downloadDocument(file);
    setDownloading(undefined);
  }

  return (
    <ul className="mt-3 space-y-1.5" aria-label="Documents produced by this task">
      {documents.map((file) => {
        const Icon = KIND_ICON[file.kind];
        return (
          <li
            key={file.path}
            className="flex items-center gap-2 rounded-md border bg-card/60 px-2.5 py-1.5 text-xs"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium" title={file.path}>
                {file.path}
              </span>
              <span className="text-muted-foreground">
                {KIND_LABEL[file.kind]} · {formatBytes(file.size)}
              </span>
            </span>
            <Button asChild size="sm" variant="ghost" className="h-7 px-2">
              <Link to="/documents" search={{ file: file.path }}>
                Open
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2"
              disabled={downloading === file.path}
              onClick={() => void download(file)}
              aria-label={`Download ${file.name}`}
            >
              <Download className="size-3.5" aria-hidden="true" />
              Download
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
