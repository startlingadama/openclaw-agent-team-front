// React Query binding for the execution stream (spec §9, §32):
// streams events for a task into the cache so the UI updates without refresh.
import { createElement } from "react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MarkdownMessage } from "@/components/markdown-message";
import { connectExecutionStream, type ExecutionEvent, type StreamState } from "./stream";
import { formatEventValue } from "@/lib/format-event-value";
import { qk } from "./queries";
import type { Task } from "./types";

export function useExecutionStream(taskId: string | undefined) {
  const qc = useQueryClient();
  const [state, setState] = useState<StreamState>("closed");

  useEffect(() => {
    if (!taskId) return;
    const stream = connectExecutionStream(taskId);
    stream.onState(setState);

    stream.onAny((e: ExecutionEvent) => {
      // Append the event to the cached task and reflect status changes.
      qc.setQueryData<Task>(qk.task(taskId), (t) => {
        if (!t) return t;
        const { task_status, ...event } = e;
        return {
          ...t,
          status: task_status ?? t.status,
          events: [...t.events, event],
        };
      });
      qc.invalidateQueries({ queryKey: qk.tasks });
      // A document tool just wrote a file: the Documents page and an open document follow.
      if (e.type === "tool.completed" && e.label.startsWith("docs.")) {
        qc.invalidateQueries({ queryKey: qk.documents });
      }
    });

    stream.on("tool.called", () => qc.invalidateQueries({ queryKey: qk.agents }));
    stream.on("agent.started", () => qc.invalidateQueries({ queryKey: qk.agents }));
    stream.on("agent.completed", () => qc.invalidateQueries({ queryKey: qk.agents }));

    stream.on("approval.required", (e) => {
      qc.invalidateQueries({ queryKey: qk.approvals });
      toast.warning("Approval required", { description: e.label });
    });
    stream.on("task.completed", (e) => {
      qc.invalidateQueries({ queryKey: qk.tasks });
      qc.invalidateQueries({ queryKey: qk.documents });
      toast.success("Task completed", {
        description:
          e.output === undefined
            ? undefined
            : createElement(MarkdownMessage, { content: formatEventValue(e.output) }),
      });
    });
    stream.on("task.failed", (e) => {
      qc.invalidateQueries({ queryKey: qk.tasks });
      toast.error("Task failed", { description: e.error ?? e.label });
    });

    return () => stream.close();
  }, [taskId, qc]);

  return state;
}
