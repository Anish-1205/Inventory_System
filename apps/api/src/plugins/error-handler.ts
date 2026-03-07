import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../lib/errors.js';
import { ZodError } from 'zod';

async function errorHandlerPlugin(app: FastifyInstance) {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        data: null,
        error: error.message,
        code: error.code,
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: 'Validation failed',
        details: error.flatten().fieldErrors,
      });
    }

    // Fastify validation error
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: 'Validation failed',
        details: error.validation,
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      success: false,
      data: null,
      error: 'Internal server error',
    });
  });
}

export const errorHandler = fp(errorHandlerPlugin, { name: 'error-handler' });
