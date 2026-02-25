type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  path?: string;
  method?: string;
  status?: number;
  duration?: number;
  userId?: string;
  error?: string;
  [key: string]: unknown;
}

function log(entry: LogEntry) {
  const output = JSON.stringify(entry);
  if (entry.level === "error") {
    console.error(output);
  } else if (entry.level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export function logInfo(message: string, meta?: Record<string, unknown>) {
  log({ level: "info", message, timestamp: new Date().toISOString(), ...meta });
}

export function logWarn(message: string, meta?: Record<string, unknown>) {
  log({ level: "warn", message, timestamp: new Date().toISOString(), ...meta });
}

export function logError(
  message: string,
  error?: unknown,
  meta?: Record<string, unknown>
) {
  log({
    level: "error",
    message,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
    ...meta,
  });
}

// Request timing helper
export function createTimer() {
  const start = Date.now();
  return () => Date.now() - start;
}
