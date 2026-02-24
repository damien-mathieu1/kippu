import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getAllTickets, getTicketKpis, runMigrations } from "@kippu/shared";

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
