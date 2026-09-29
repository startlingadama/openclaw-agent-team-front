import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { MarkdownMessage } from "@/components/markdown-message";
import { ErrorBox, LoadingRows } from "@/components/query-state";
import { EmptyState, PageHeader, Panel } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DocumentFile } from "@/lib/api";
import { documentBlobQuery, documentsQuery, documentTextQuery } from "@/lib/api/queries";
import {
  downloadDocument,
  formatBytes,
  groupByFolder,
  KIND_ICON,
  KIND_LABEL,
  kindOf,
} from "@/lib/documents";
import { usePersistentState } from "@/lib/persistent-state";
import { cn } from "@/lib/utils";

const DESCRIPTION = "Documents produced by the writer agent: read them or download them.";

export const Route = createFileRoute("/documents")({
  validateSearch: z.object({ file: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Documents - OpenClaw" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Documents - OpenClaw" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: DocumentsPage,
});

const ago = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true });

function DocumentsPage() {
  const { file: fromUrl } = Route.useSearch();
  // The open document and the filter survive a visit to another page.
  const [remembered, setRemembered] = usePersistentState("documents:file", "");
  const [filter, setFilter] = usePersistentState("documents:filter", "");
  const { data, isLoading, error, refetch } = useQuery(documentsQuery());

  useEffect(() => {
    if (fromUrl) setRemembered(fromUrl);
  }, [fromUrl, setRemembered]);
  const selectedPath = fromUrl ?? remembered;

  const shown = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return (data ?? []).filter(
      (file) => !query || `${file.path} ${file.taskTitle ?? ""}`.toLowerCase().includes(query),
    );
  }, [data, filter]);
  const groups = useMemo(() => groupByFolder(shown), [shown]);

  return (
    <>
      <PageHeader
        title="Documents"
        description={DESCRIPTION}
        actions={
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter documents…"
            aria-label="Filter documents"
            className="h-8 w-56"
          />
        }
      />
      {error && <ErrorBox error={error} onRetry={() => refetch()} />}
      {isLoading ? (
        <LoadingRows />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <Panel title={`History · ${shown.length}`} className="overflow-hidden">
            {!groups.length ? (
              <EmptyState
                title={data?.length ? "No matching documents" : "No documents yet"}
                description={
                  data?.length
                    ? "Try a different filter."
                    : "Ask the writer agent for a document: the files it writes appear here."
                }
              />
            ) : (
              groups.map((group) => (
                <div key={group.folder || "."} className="border-b last:border-b-0">
                  <div className="flex items-center justify-between gap-2 bg-muted/30 px-4 py-2 text-xs">
                    <span className="truncate font-mono font-medium">
                      {group.folder || "Loose files"}
                    </span>
                    <span className="shrink-0 text-muted-foreground">{ago(group.modified)}</span>
                  </div>
                  <ul className="divide-y">
                    {group.files.map((file) => (
                      <DocumentRow
                        key={file.path}
                        file={file}
                        active={file.path === selectedPath}
                      />
                    ))}
                  </ul>
                </div>
              ))
            )}
          </Panel>

          <div className={cn("min-w-0", selectedPath && "order-first lg:order-none")}>
            {selectedPath ? (
              <DocumentViewer
                key={selectedPath}
                path={selectedPath}
                file={data?.find((file) => file.path === selectedPath)}
              />
            ) : (
              <Panel>
                <EmptyState
                  title="Select a document"
                  description="Markdown, LaTeX sources and PDFs open here."
                />
              </Panel>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DocumentRow({ file, active }: { file: DocumentFile; active: boolean }) {
  const Icon = KIND_ICON[file.kind];
  return (
    <li className="flex items-center pr-2">
      <Link
        to="/documents"
        search={{ file: file.path }}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5 transition-colors hover:bg-accent/40",
          active && "bg-accent/60",
        )}
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{file.name}</span>
          <span className="text-[11px] text-muted-foreground">
            {KIND_LABEL[file.kind]} · {formatBytes(file.size)} · {ago(file.modified)}
          </span>
        </span>
      </Link>
      <Button
        size="icon"
        variant="ghost"
        className="size-8 shrink-0"
        aria-label={`Download ${file.name}`}
        onClick={() => void downloadDocument(file)}
      >
        <Download className="size-4" aria-hidden="true" />
      </Button>
    </li>
  );
}

function DocumentViewer({ path, file }: { path: string; file: DocumentFile | undefined }) {
  const kind = file?.kind ?? kindOf(path);
  const name = file?.name ?? path.split("/").pop() ?? path;
  return (
    <Panel
      title={path}
      className="overflow-hidden"
      action={
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2"
          onClick={() => void downloadDocument({ path, name })}
        >
          <Download className="size-3.5" aria-hidden="true" />
          Download
        </Button>
      }
    >
      {file && (
        <p className="border-b px-4 py-2 text-xs text-muted-foreground">
          {KIND_LABEL[file.kind]} · {formatBytes(file.size)} · updated {ago(file.modified)}
          {file.taskId && (
            <>
              {" · "}
              <Link
                to="/tasks/$taskId"
                params={{ taskId: file.taskId }}
                className="underline underline-offset-2 hover:text-foreground"
              >
                {file.taskTitle ? `Task: ${file.taskTitle}` : `Task ${file.taskId}`}
              </Link>
            </>
          )}
        </p>
      )}
      {kind === "pdf" ? (
        <PdfFrame path={path} name={name} />
      ) : kind ? (
        <TextBody path={path} kind={kind} />
      ) : (
        <EmptyState title="Cannot be shown" description="Download it to open it." />
      )}
    </Panel>
  );
}

function TextBody({ path, kind }: { path: string; kind: "md" | "tex" }) {
  const { data, isLoading, error, refetch } = useQuery(documentTextQuery(path));
  if (isLoading) return <LoadingRows />;
  if (error) return <ErrorBox error={error} onRetry={() => refetch()} />;
  if (kind === "md") {
    return (
      <div className="max-h-[75vh] overflow-y-auto p-4 text-sm">
        <MarkdownMessage content={data ?? ""} />
      </div>
    );
  }
  return (
    <pre className="max-h-[75vh] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed">
      {data}
    </pre>
  );
}

function PdfFrame({ path, name }: { path: string; name: string }) {
  const { data: blob, isLoading, error, refetch } = useQuery(documentBlobQuery(path));
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);
  if (isLoading) return <LoadingRows />;
  if (error) return <ErrorBox error={error} onRetry={() => refetch()} />;
  return url ? <iframe src={url} title={name} className="h-[75vh] w-full bg-background" /> : null;
}
