import { isMainThread, parentPort } from "node:worker_threads";

if (isMainThread) {
  throw new Error("Worker in main thread");
}

setInterval(() => {
  console.info("Worker... working...");
}, 5000);

parentPort?.on("message", (mes) => {
  console.info(`[worker] ${mes}`);
});
