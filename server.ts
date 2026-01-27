import Fastify from "fastify";
import cors from "@fastify/cors";
import fs from "fs/promises";
import path from "path";

const fastify = Fastify({ logger: true });

// Register CORS
await fastify.register(cors, { origin: "*" });

const DB_PATH = path.join(process.cwd(), "local_db");
await fs.mkdir(DB_PATH, { recursive: true });

// Define the interface for the Ticket ID parameter
interface TicketParams {
  id: string;
}

// GET Note
// We pass <{ Params: TicketParams }> to tell Fastify what the params look like
fastify.get<{ Params: TicketParams }>(
  "/api/notes/:id",
  async (request, _reply) => {
    const filePath = path.join(DB_PATH, `ticket_${request.params.id}.json`);
    try {
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch {
      return { content: null };
    }
  },
);

// SAVE Note
fastify.post<{ Params: TicketParams }>(
  "/api/notes/:id",
  async (request, _reply) => {
    const filePath = path.join(DB_PATH, `ticket_${request.params.id}.json`);
    // request.body is automatically typed as any/unknown unless you define it,
    // but for a prototype, this works fine.
    await fs.writeFile(filePath, JSON.stringify(request.body, null, 2));
    return { status: "success" };
  },
);

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log("🚀 Fastify DB running at http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
