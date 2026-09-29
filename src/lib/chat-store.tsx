// Chat state lives above the router outlet so it survives page changes.
// It also owns the task polling and the SSE stream: an agent that is waiting for
// approval keeps being tracked while you are on the Approvals page, and the
// conversation is exactly where you left it when you come back.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Agent, type DocumentFile, type Task, type TaskEvent } from "@/lib/api";
import { qk, taskQuery } from "@/lib/api/queries";
import { useExecutionStream } from "@/lib/api/use-execution-stream";
import { formatEventValue } from "@/lib/format-event-value";

type TaskProgress = Pick<TaskEvent, "time" | "type" | "label" | "status">;

export type ChatMessage = {
  role: "user" | "agent" | "error";
  text: string;
  taskId?: string;
  progress?: TaskProgress[];
  /** Files the task produced (writer agent), downloadable under the answer. */
  documents?: DocumentFile[];
};

const PROGRESS_EVENTS = new Set([
  "agent.started",
  "agent.thinking",
  "skill.loaded",
  "tool.called",
  "tool.completed",
  "approval.required",
  "approval.resolved",
]);

const WAITING_TEXT = "This task is waiting for approval.";
const STORAGE_KEY = "openclaw.chat.v1";

type Persisted = {
  agent: string;
  input: string;
  msgs: ChatMessage[];
  activeTaskId: string | undefined;
};

function loadSession(): Persisted | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Persisted) : null;
  } catch {
    return null;
  }
}

export function clearChatSession() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable: nothing to clear
  }
}

type ChatContextValue = {
  agent: string;
  setAgent: (agent: string) => void;
  input: string;
  setInput: (input: string) => void;
  msgs: ChatMessage[];
  busy: boolean;
  /** Live data of the task currently running, if any. */
  activeTask: Task | undefined;
  send: () => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [agent, setAgent] = useState("github");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);

  // Restore after a full page reload (client only, so SSR markup stays identical).
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setAgent(saved.agent);
      setInput(saved.input);
      setMsgs(saved.msgs);
      setActiveTaskId(saved.activeTaskId);
      setBusy(!!saved.activeTaskId);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const snapshot: Persisted = { agent, input, msgs, activeTaskId };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // quota or privacy mode: in-memory state still works
    }
  }, [hydrated, agent, input, msgs, activeTaskId]);

  // A finished task may have produced files: they are read fresh from the backend (the cached
  // task was built from stream events, which do not carry them) and shown under the answer.
  const attachDocuments = useCallback(
    async (taskId: string) => {
      try {
        const fresh = await qc.fetchQuery({ ...taskQuery(taskId), staleTime: 0 });
        const documents = fresh.documents ?? [];
        if (!documents.length) return;
        setMsgs((current) =>
          current.map((message) => (message.taskId === taskId ? { ...message, documents } : message)),
        );
        void qc.invalidateQueries({ queryKey: qk.documents });
      } catch {
        // The answer is already shown; the Documents page still lists the files.
      }
    },
    [qc],
  );

  const taskResult = useQuery({
    ...taskQuery(activeTaskId ?? ""),
    enabled: !!activeTaskId,
    refetchInterval: activeTaskId ? 1000 : false,
  });
  useExecutionStream(activeTaskId);

  useEffect(() => {
    if (!activeTaskId) return;
    const patch = (update: (message: ChatMessage) => ChatMessage) =>
      setMsgs((current) =>
        current.map((message) => (message.taskId === activeTaskId ? update(message) : message)),
      );

    if (taskResult.error) {
      patch((message) => ({
        ...message,
        role: "error",
        text: `Could not load task result: ${taskResult.error.message}`,
      }));
      setActiveTaskId(undefined);
      setBusy(false);
      return;
    }

    const task = taskResult.data;
    if (!task) return;
    const progress = task.events
      .filter((event) => PROGRESS_EVENTS.has(event.type))
      .map(({ time, type, label, status }) => ({ time, type, label, status }));

    if (task.status === "waiting_approval") {
      patch((message) => ({ ...message, text: WAITING_TEXT, progress }));
      return;
    }
    if (task.status !== "completed" && task.status !== "failed" && task.status !== "cancelled") {
      patch((message) => ({
        ...message,
        text: message.text === WAITING_TEXT ? "Approval received. Resuming the task…" : message.text,
        progress,
      }));
      return;
    }

    const finalEvent = [...task.events]
      .reverse()
      .find((event) => event.type === "task.completed" || event.type === "task.failed");
    const result =
      task.status === "completed"
        ? finalEvent?.output === undefined
          ? "Task completed without a result."
          : formatEventValue(finalEvent.output)
        : (finalEvent?.error ?? `Task ${task.status}.`);
    patch((message) => ({
      ...message,
      role: task.status === "completed" ? "agent" : "error",
      text: result,
      progress: [],
    }));
    setActiveTaskId(undefined);
    setBusy(false);
    void attachDocuments(activeTaskId);
  }, [activeTaskId, taskResult.data, taskResult.error, attachDocuments]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    const agentName = qc.getQueryData<Agent[]>(qk.agents)?.find((a) => a.id === agent)?.name ?? agent;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const r = await api.chat.send(agent, text);
      const taskId = r.task_id;
      if (!taskId) throw new Error("The backend did not return a task ID for this chat request.");
      setMsgs((m) => [...m, { role: "agent", text: `${agentName} is working…`, taskId }]);
      setActiveTaskId(taskId);
    } catch (err) {
      setMsgs((m) => [...m, { role: "error", text: (err as Error).message }]);
      setBusy(false);
    }
  }, [agent, busy, input, qc]);

  const value = useMemo<ChatContextValue>(
    () => ({ agent, setAgent, input, setInput, msgs, busy, activeTask: taskResult.data, send }),
    [agent, input, msgs, busy, taskResult.data, send],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside ChatProvider");
  return context;
}
