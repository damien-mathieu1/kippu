import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getAllTickets, getTicketKpis, runMigrations, getDLQErrors, getDLQKpis, getTicketsOverTime, getDLQErrorsOverTime } from "@kippu/shared";

const app = new Hono();

app.use("/*", cors());

app.get("/tickets", async (c) => {
  const limit = Number(c.req.query("limit") || 100);
  const offset = Number(c.req.query("offset") || 0);
  const tickets = await getAllTickets(limit, offset);
  return c.json(tickets);
});

app.get("/kpis", async (c) => {
  const kpis = await getTicketKpis();
  return c.json(kpis);
});

app.get("/kpis/timeseries", async (c) => {
  const timeseries = await getTicketsOverTime();
  return c.json(timeseries);
});

app.get("/dlq", async (c) => {
  const limit = Number(c.req.query("limit") || 100);
  const offset = Number(c.req.query("offset") || 0);
  const sourceTopic = c.req.query("sourceTopic");
  const statusParam = c.req.query("status");
  const status = statusParam as import("@kippu/shared").DLQErrorStatus | undefined;

  const dlqErrors = await getDLQErrors({ limit, offset, sourceTopic, status });
  return c.json(dlqErrors);
});

app.get("/dlq/count", async (c) => {
  const kpis = await getDLQKpis();
  return c.json(kpis);
});

app.get("/dlq/timeseries", async (c) => {
  const timeseries = await getDLQErrorsOverTime();
  return c.json(timeseries);
});

async function start() {
  await runMigrations();

  serve({ fetch: app.fetch, port: 3000 }, (info) => {
    console.log(`Backend running on http://localhost:${info.port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
