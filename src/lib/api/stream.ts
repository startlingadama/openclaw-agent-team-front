// Real execution events arrive from the backend over authenticated SSE.
import { getBaseUrl, getToken } from "./client";
import type { TaskEvent, TaskStatus } from "./types";

export interface ExecutionEvent extends TaskEvent {
  task_id: string;
  task_status?: TaskStatus;
}

type Handler = (event: ExecutionEvent) => void;
export type StreamState = "connecting" | "open" | "closed" | "error";

const TERMINAL = new Set(["task.completed", "task.failed", "task.cancelled"]);

export class ExecutionStream {
  private handlers = new Map<string, Set<Handler>>();
  private anyHandlers = new Set<Handler>();
  private stateHandlers = new Set<(state: StreamState) => void>();
  private abort: AbortController | null = null;
  private retries = 0;
  state: StreamState = "closed";

  constructor(private taskId: string) {}

  on(type: string, callback: Handler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(callback);
    return this;
  }

  onAny(callback: Handler) {
    this.anyHandlers.add(callback);
    return this;
  }

  onState(callback: (state: StreamState) => void) {
    this.stateHandlers.add(callback);
    callback(this.state);
    return this;
  }

  private setState(state: StreamState) {
    this.state = state;
    this.stateHandlers.forEach((callback) => callback(state));
  }

  private emit(event: ExecutionEvent) {
    this.anyHandlers.forEach((callback) => callback(event));
    this.handlers.get(event.type)?.forEach((callback) => callback(event));
    if (TERMINAL.has(event.type)) this.close();
  }

  connect() {
    this.setState("connecting");
    void this.pump();
    return this;
  }

  close() {
    this.abort?.abort();
    this.abort = null;
    if (this.state !== "closed") this.setState("closed");
  }

  private async pump() {
    const controller = new AbortController();
    this.abort = controller;
    try {
      const token = getToken();
      const response = await fetch(
        `${getBaseUrl()}/api/tasks/${encodeURIComponent(this.taskId)}/events`,
        {
          headers: {
            Accept: "text/event-stream",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        },
      );
      if (!response.ok || !response.body) {
        throw new Error(`Stream failed (${response.status})`);
      }
      this.retries = 0;
      this.setState("open");
      await readSse(response.body, (eventName, data) => {
        try {
          const parsed = JSON.parse(data) as Partial<ExecutionEvent>;
          this.emit({
            task_id: this.taskId,
            time: parsed.time ?? new Date().toTimeString().slice(0, 5),
            type: parsed.type ?? eventName ?? "message",
            label: parsed.label ?? parsed.type ?? eventName ?? "event",
            status: parsed.status ?? "ok",
            ...(parsed.duration !== undefined ? { duration: parsed.duration } : {}),
            ...(parsed.input !== undefined ? { input: parsed.input } : {}),
            ...(parsed.output !== undefined ? { output: parsed.output } : {}),
            ...(parsed.error !== undefined ? { error: parsed.error } : {}),
            ...(parsed.task_status !== undefined ? { task_status: parsed.task_status } : {}),
          });
        } catch {
          // Ignore malformed frames; a later valid event can still update the task.
        }
      });
      if (this.state !== "closed") this.setState("closed");
    } catch (error) {
      if (controller.signal.aborted) return;
      this.setState("error");
      if (this.retries < 5) {
        this.retries += 1;
        const delay = Math.min(1000 * 2 ** this.retries, 15_000);
        setTimeout(() => {
          if (this.state === "error") void this.pump();
        }, delay);
      }
      void error;
    }
  }
}

async function readSse(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: string | null, data: string) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      let event: string | null = null;
      const dataLines: string[] = [];
      for (const line of frame.split(/\r?\n/)) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      }
      if (dataLines.length) onEvent(event, dataLines.join("\n"));
    }
  }
}

export function connectExecutionStream(taskId: string) {
  return new ExecutionStream(taskId).connect();
}
