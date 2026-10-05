import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

// Transport-only probe. Does not create threads or turns, execute tools, or read credentials.
const binary = process.env.CODEX_BINARY || "codex";
const child = spawn(binary, ["app-server", "--listen", "stdio://"], {
  stdio: ["pipe", "pipe", "pipe"],
  windowsHide: true,
});
let finished = false;
const pending = new Map();
let nextId = 1;
const timeout = setTimeout(() => finish(1, "App Server: timeout di connessione"), 20000);

function finish(code, message) {
  if (finished) return;
  finished = true;
  clearTimeout(timeout);
  console.log(message);
  lines.close();
  child.stdin.end();
  child.kill();
  process.exitCode = code;
}

function request(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    child.stdin.write(JSON.stringify({ id, method, params }) + "\n");
  });
}

const lines = createInterface({ input: child.stdout });
lines.on("line", (line) => {
  let message;
  try { message = JSON.parse(line); } catch { return; }
  const waiting = pending.get(message.id);
  if (waiting) {
    pending.delete(message.id);
    if (message.error) waiting.reject(new Error("RPC rifiutata: " + message.error.code));
    else waiting.resolve(message.result);
  } else if (message.id !== undefined && message.method) {
    // Never grant an unsolicited approval.
    child.stdin.write(JSON.stringify({ id: message.id, error: { code: -32601, message: "Probe does not execute server requests" } }) + "\n");
  }
});
child.stderr.on("data", () => {}); // Do not print runtime logs that may contain account information.
child.on("error", () => finish(1, "App Server: impossibile avviare il binario"));
child.on("exit", () => {
  if (!finished) finish(1, "App Server: processo terminato prima della verifica");
});

try {
  await request("initialize", { clientInfo: { name: "yachting_controller_probe", title: "Yachting Controller Probe", version: "0.1.0" } });
  child.stdin.write(JSON.stringify({ method: "initialized", params: {} }) + "\n");
  await request("thread/list", { limit: 1 });
  finish(0, "App Server: handshake e thread/list riusciti. Nessun lavoro AI avviato.");
} catch {
  finish(1, "App Server: verifica del protocollo non riuscita");
}
