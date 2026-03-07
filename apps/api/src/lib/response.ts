import type { FastifyReply } from 'fastify';

export function ok<T>(reply: FastifyReply, data: T, statusCode = 200) {
  return reply.status(statusCode).send({ success: true, data });
}

export function paginated<T>(
  reply: FastifyReply,
  data: T[],
  meta: { total: number; page: number; limit: number },
) {
  return reply.status(200).send({ success: true, data, meta });
}

export function created<T>(reply: FastifyReply, data: T) {
  return ok(reply, data, 201);
}
