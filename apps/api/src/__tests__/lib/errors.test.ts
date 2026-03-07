import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '../../lib/errors.js';

describe('AppError', () => {
  it('sets statusCode, message, and code', () => {
    const err = new AppError(500, 'something went wrong', 'SERVER_ERROR');
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('something went wrong');
    expect(err.code).toBe('SERVER_ERROR');
    expect(err.name).toBe('AppError');
  });

  it('is an instance of Error', () => {
    const err = new AppError(500, 'oops');
    expect(err).toBeInstanceOf(Error);
  });

  it('allows code to be undefined', () => {
    const err = new AppError(500, 'oops');
    expect(err.code).toBeUndefined();
  });
});

describe('NotFoundError', () => {
  it('has statusCode 404 and code NOT_FOUND', () => {
    const err = new NotFoundError('Product');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Product not found');
  });

  it('is an instance of AppError and Error', () => {
    const err = new NotFoundError('Item');
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('UnauthorizedError', () => {
  it('has statusCode 401 and code UNAUTHORIZED', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('Unauthorized');
  });

  it('accepts a custom message', () => {
    const err = new UnauthorizedError('Token expired');
    expect(err.message).toBe('Token expired');
  });

  it('is an instance of AppError', () => {
    expect(new UnauthorizedError()).toBeInstanceOf(AppError);
  });
});

describe('ForbiddenError', () => {
  it('has statusCode 403 and code FORBIDDEN', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.message).toBe('Forbidden');
  });

  it('accepts a custom message', () => {
    const err = new ForbiddenError('Admin only');
    expect(err.message).toBe('Admin only');
  });

  it('is an instance of AppError', () => {
    expect(new ForbiddenError()).toBeInstanceOf(AppError);
  });
});

describe('ConflictError', () => {
  it('has statusCode 409 and code CONFLICT', () => {
    const err = new ConflictError('Email already in use');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
    expect(err.message).toBe('Email already in use');
  });

  it('is an instance of AppError', () => {
    expect(new ConflictError('dup')).toBeInstanceOf(AppError);
  });
});

describe('ValidationError', () => {
  it('has statusCode 400 and code VALIDATION_ERROR', () => {
    const err = new ValidationError('Invalid email');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Invalid email');
  });

  it('is an instance of AppError', () => {
    expect(new ValidationError('bad')).toBeInstanceOf(AppError);
  });
});
