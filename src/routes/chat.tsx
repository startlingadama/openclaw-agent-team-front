import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { agentsQuery } from "@/lib/api/queries";
import { useChat } from "@/lib/chat-store";
import { DocumentLinks } from "@/components/document-links";
import { PageHeader, Panel } from "@/components/status";
import { MarkdownMessage } from "@/components/markdown-message";
import { ErrorBox, InlineSpinner } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat - OpenClaw" },
      { name: "description", content: "Talk to your AI agents." },
      { property: "og:title", content: "Chat - OpenClaw" },
      { property: "og:description", content: "Talk to your AI agents." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { data: agents, error: agentsError, refetch } = useQuery(agentsQuery());
  const { agent, setAgent, input, setInput, msgs, busy, activeTask, send } = useChat();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, busy]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send();
  }

  const agentName = agents?.find((a) => a.id === agent)?.name ?? agent;
  const lastEvent = activeTask?.events.at(-1);
  const busyLabel =
    activeTask?.status === "waiting_approval"
      ? "Waiting for approval…"
      : lastEvent?.type === "tool.called"
        ? `Executing ${lastEvent.label}…`
        : lastEvent?.type === "skill.loaded"
          ? `${lastEvent.label}…`
          : `${agentName} is thinking…`;

  return (
    <>
      <PageHeader
        title="Chat"
        description="Send a message to an agent."
        actions={
          <Select value={agent} onValueChange={setAgent}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Select the agent to talk to">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {agents?.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      {agentsError && <ErrorBox error={agentsError} onRetry={() => refetch()} />}
      <Panel className="flex h-[calc(100dvh-13rem)] flex-col overflow-hidden">
        <div
          className="flex-1 space-y-3 overflow-y-auto p-4"
          aria-live="polite"
          aria-label={`Conversation with ${agentName}`}
          role="log"
        >
          {!msgs.length && (
            <p className="text-sm text-muted-foreground">
              No messages yet. Ask {agentName} for something to start a task.
            </p>
          )}
          {msgs.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground sm:max-w-[80%]"
                  : m.role === "error"
                    ? "max-w-[85%] rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:max-w-[80%]"
                    : "max-w-[85%] rounded-md border bg-background px-3 py-2 text-sm sm:max-w-[80%]"
              }
            >
              <span className="sr-only">
                {m.role === "user" ? "You: " : m.role === "error" ? "Error: " : `${agentName}: `}
              </span>
              {m.role === "agent" ? <MarkdownMessage content={m.text} /> : m.text}
              {m.progress?.length ? (
                <ol className="mt-3 space-y-1.5 border-l pl-3 text-xs text-muted-foreground">
                  {m.progress.map((step, index) => (
                    <li key={`${step.time}-${step.type}-${index}`} className="flex gap-2">
                      <span className="w-10 shrink-0 font-mono opacity-70">{step.time}</span>
                      <span className="min-w-0 flex-1">{step.label}</span>
                      <span className="shrink-0 capitalize">{step.status}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
              {m.documents?.length ? <DocumentLinks documents={m.documents} /> : null}
            </div>
          ))}
          {busy && <InlineSpinner label={busyLabel} />}
          <div ref={endRef} />
        </div>
        <form onSubmit={onSubmit} className="sticky bottom-0 flex gap-2 border-t bg-card p-3">
          <label htmlFor="chat-input" className="sr-only">
            Message to {agentName}
          </label>
          <Textarea
            id="chat-input"
            rows={2}
            value={input}
            maxLength={4000}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent…"
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <Button type="submit" disabled={busy || !input.trim()}>
            Send
          </Button>
        </form>
      </Panel>
    </>
  );
}
