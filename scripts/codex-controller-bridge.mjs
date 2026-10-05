import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HOST = "127.0.0.1";
const PORT = Number(process.env.YACHTING_CONTROLLER_PORT || 4319);
const WORKSPACE = "C:\\Users\\simon\\Documents\\Codex\\2026-08-09\\referenced-chatgpt-conversation-this-is-an\\work\\metayachting-ai";
const CODEX = process.env.CODEX_BINARY || "codex";
const COOKIE = "yachting_controller";
const loginCode = randomBytes(24).toString("base64url");
const sessionCode = randomBytes(32).toString("base64url");
const pending = new Map();
const subscribers = new Set();
const rpcPending = new Map();
let child;
let nextId = 1;
let rpcReady = false;

function publish(kind, data) {
  const line = "event: " + kind + "\ndata: " + JSON.stringify(data) + "\n\n";
  for (const response of subscribers) response.write(line);
}

function sendRpc(method, params = {}) {
  if (!child || child.exitCode !== null) throw new Error("App Server non attivo");
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      rpcPending.delete(id);
      reject(new Error("Timeout App Server"));
    }, 30000);
    rpcPending.set(id, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ id, method, params }) + "\n");
  });
}

function startAppServer() {
  child = spawn(CODEX, ["app-server", "--listen", "stdio://"], {
    cwd: WORKSPACE,
    windowsHide: true,
    stdio: ["pipe", "pipe", "ignore"],
  });
  const lines = createInterface({ input: child.stdout });
  lines.on("line", (line) => {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    if (message.id !== undefined && (message.result !== undefined || message.error !== undefined)) {
      const waiter = rpcPending.get(message.id);
      if (waiter) {
        clearTimeout(waiter.timer);
        rpcPending.delete(message.id);
        message.error ? waiter.reject(new Error(message.error.message || "RPC rifiutata")) : waiter.resolve(message.result);
      }
      return;
    }
    if (message.id !== undefined && message.method) {
      if (["item/commandExecution/requestApproval", "item/fileChange/requestApproval"].includes(message.method)) {
        pending.set(String(message.id), { id: message.id, method: message.method, params: message.params });
        publish("approval", { id: String(message.id), method: message.method, params: message.params });
      } else {
        child.stdin.write(JSON.stringify({ id: message.id, error: { code: -32601, message: "Richiesta server non gestita dal controller" } }) + "\n");
        publish("notice", { message: "Richiesta App Server non supportata: " + message.method });
      }
      return;
    }
    if (message.method) publish("runtime", message);
  });
  child.on("error", () => {
    rpcReady = false;
    publish("notice", { message: "Avvio Codex App Server non riuscito. Controlla CODEX_BINARY e l'installazione Codex." });
  });
  child.on("exit", (code) => {
    rpcReady = false;
    for (const [id, waiter] of rpcPending) {
      clearTimeout(waiter.timer);
      waiter.reject(new Error("App Server terminato"));
      rpcPending.delete(id);
    }
    publish("notice", { message: "App Server terminato (codice " + (code ?? "sconosciuto") + ")" });
  });
  void (async () => {
    try {
      await sendRpc("initialize", { clientInfo: { name: "yachting_agent_ai_controller", title: "Yachting Agent AI Controller", version: "0.2.0" } });
      child.stdin.write(JSON.stringify({ method: "initialized", params: {} }) + "\n");
      rpcReady = true;
      publish("notice", { message: "Codex App Server connesso. Workspace in sola lettura; le richieste di permesso attendono il titolare." });
    } catch (error) {
      publish("notice", { message: error.message });
    }
  })();
}

function isLoopback(address = "") {
  return address === "::1" || address === "127.0.0.1" || address.startsWith("::ffff:127.");
}

function equalSecret(candidate) {
  if (typeof candidate !== "string") return false;
  const left = Buffer.from(candidate);
  const right = Buffer.from(loginCode);
  return left.length === right.length && timingSafeEqual(left, right);
}

function equalSession(candidate) {
  if (typeof candidate !== "string") return false;
  const left = Buffer.from(candidate);
  const right = Buffer.from(sessionCode);
  return left.length === right.length && timingSafeEqual(left, right);
}

function authorized(request) {
  if (!isLoopback(request.socket.remoteAddress)) return false;
  const host = request.headers.host;
  if (host !== "127.0.0.1:" + PORT && host !== "localhost:" + PORT) return false;
  const cookie = request.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(COOKIE + "="));
  return equalSession(cookie?.slice(COOKIE.length + 1));
}

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(JSON.stringify(data));
}

async function readBody(request) {
  let value = "";
  for await (const chunk of request) {
    value += chunk;
    if (value.length > 20000) throw new Error("Richiesta troppo lunga");
  }
  return value ? JSON.parse(value) : {};
}

const uiPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "controller-ui.html");
if (!existsSync(WORKSPACE) || !existsSync(uiPath)) throw new Error("Workspace o interfaccia controller non trovati");

const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://" + HOST + ":" + PORT);
  if (url.pathname === "/login" && request.method === "GET") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:" });
    return createReadStream(uiPath).pipe(response);
  }
  if (url.pathname === "/api/login" && request.method === "POST") {
    if (!isLoopback(request.socket.remoteAddress)) return sendJson(response, 403, { error: "Connessione consentita solo dal computer locale" });
    if (request.headers.host !== "127.0.0.1:" + PORT && request.headers.host !== "localhost:" + PORT) return sendJson(response, 403, { error: "Host locale non riconosciuto" });
    if (request.headers.origin && request.headers.origin !== "http://127.0.0.1:" + PORT && request.headers.origin !== "http://localhost:" + PORT) return sendJson(response, 403, { error: "Origine non valida" });
    try {
      const body = await readBody(request);
      if (!equalSecret(body.code)) return sendJson(response, 401, { error: "Codice locale non valido" });
      response.writeHead(200, { "Content-Type": "application/json", "Set-Cookie": COOKIE + "=" + sessionCode + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800", "Cache-Control": "no-store" });
      return response.end(JSON.stringify({ ok: true }));
    } catch { return sendJson(response, 400, { error: "Richiesta non valida" }); }
  }
  if (url.pathname.startsWith("/api/") && !authorized(request)) return sendJson(response, 401, { error: "Accedi al controller da questo computer" });
  if (request.method !== "GET" && request.headers.origin !== "http://" + request.headers.host) return sendJson(response, 403, { error: "Origine non valida" });
  try {
    if (url.pathname === "/api/status" && request.method === "GET") return sendJson(response, 200, { connected: rpcReady, workspace: WORKSPACE, pendingApprovals: pending.size, mode: "read-only" });
    if (url.pathname === "/api/events" && request.method === "GET") {
      response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Accel-Buffering": "no" });
      response.write("event: snapshot\ndata: " + JSON.stringify({ connected: rpcReady, approvals: [...pending.values()].map((item) => ({ ...item, id: String(item.id) })) }) + "\n\n");
      subscribers.add(response);
      request.on("close", () => subscribers.delete(response));
      return;
    }
    if (url.pathname === "/api/threads" && request.method === "GET") return sendJson(response, 200, await sendRpc("thread/list", { limit: 30, sortKey: "recency_at", sortDirection: "desc" }));
    if (url.pathname === "/api/threads" && request.method === "POST") {
      const thread = await sendRpc("thread/start", { cwd: WORKSPACE, sandbox: "read-only", approvalPolicy: "on-request", serviceName: "yachting_agent_ai_controller" });
      publish("thread", thread);
      return sendJson(response, 201, thread);
    }
    if (url.pathname === "/api/turns" && request.method === "POST") {
      const body = await readBody(request);
      if (typeof body.threadId !== "string" || typeof body.objective !== "string" || body.objective.trim().length < 4 || body.objective.length > 4000) return sendJson(response, 400, { error: "Inserisci thread e obiettivo (4–4000 caratteri)" });
      const result = await sendRpc("turn/start", { threadId: body.threadId, cwd: WORKSPACE, sandboxPolicy: { type: "readOnly" }, approvalPolicy: "on-request", input: [{ type: "text", text: body.objective.trim() }] });
      publish("turn", result);
      return sendJson(response, 202, result);
    }
    if (url.pathname.startsWith("/api/approvals/") && request.method === "POST") {
      const id = decodeURIComponent(url.pathname.slice("/api/approvals/".length));
      const item = pending.get(id);
      if (!item) return sendJson(response, 404, { error: "Richiesta non più pendente" });
      const body = await readBody(request);
      const decision = body.decision;
      if (!["accept", "decline", "cancel"].includes(decision) || (decision === "accept" && body.confirm !== true)) return sendJson(response, 400, { error: "Decisione non valida o conferma esplicita mancante" });
      child.stdin.write(JSON.stringify({ id: item.id, result: { decision } }) + "\n");
      pending.delete(id);
      publish("approval-resolved", { id, decision });
      return sendJson(response, 200, { ok: true });
    }
    if (url.pathname === "/api/stop" && request.method === "POST") {
      child?.kill();
      rpcReady = false;
      pending.clear();
      return sendJson(response, 200, { ok: true });
    }
    if (url.pathname === "/") { response.writeHead(303, { Location: "/login" }); return response.end(); }
    return sendJson(response, 404, { error: "Percorso non trovato" });
  } catch (error) {
    return sendJson(response, 502, { error: error instanceof Error ? error.message : "Errore bridge" });
  }
});

server.listen(PORT, HOST, () => {
  console.log("Controller locale: http://" + HOST + ":" + PORT + "/login");
  console.log("Codice di accesso temporaneo (non condividerlo): " + loginCode);
  console.log("Workspace autorizzato: " + WORKSPACE);
  startAppServer();
});

function shutdown() {
  child?.kill();
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
