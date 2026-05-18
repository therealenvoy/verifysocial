/**
 * Structured logger — JSON line per event, level-aware.
 *
 * Used in place of console.* across production code paths so log output stays
 * machine-parseable (Axiom / Vercel logs / Railway logs all ingest JSON cleanly)
 * and the verifier can enforce a no-console-in-production rule.
 *
 * Errors and warnings go to stderr; info/debug to stdout. No third-party deps
 * because the surface area is tiny and we don't want a logging library in the
 * client bundle.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
  // Suppress debug output unless explicitly enabled. Keeps test output clean.
  if (level === "debug" && process.env.LOG_LEVEL !== "debug") return;

  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta ?? {}),
  };

  const line = JSON.stringify(entry) + "\n";
  if (level === "error" || level === "warn") {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};
