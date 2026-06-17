import { MnemosAgentError } from '../agent-runtime.js';

export function expectArgsObject(args: unknown): Record<string, unknown> {
  if (args === null || args === undefined) return {};
  if (typeof args === 'object' && !Array.isArray(args)) return args as Record<string, unknown>;
  throw new MnemosAgentError('INVALID_INPUT', 'Tool arguments must be an object.');
}

export function assertNoUnknownFields(args: Record<string, unknown>, allowed: string[]): void {
  for (const key of Object.keys(args)) {
    if (!allowed.includes(key)) {
      throw new MnemosAgentError(
        'INVALID_INPUT',
        `Unknown argument: "${key}".`,
        `Allowed arguments: ${allowed.join(', ') || '(none)'}`,
        { fieldErrors: [{ field: key, message: 'Unknown argument.' }] },
      );
    }
  }
}

export function stringArg(
  args: Record<string, unknown>,
  key: string,
  options: { required?: boolean; minLength?: number; trim?: boolean } = {},
): string {
  const value = args[key];
  const required = options.required !== false;
  const trim = options.trim !== false;
  const minLength = options.minLength ?? (required ? 1 : 0);

  if (value === undefined || value === null) {
    if (!required) return '';
    throw new MnemosAgentError(
      'INVALID_INPUT',
      `Missing required argument: "${key}".`,
      undefined,
      { fieldErrors: [{ field: key, message: 'Required.' }] },
    );
  }

  if (typeof value !== 'string') {
    throw new MnemosAgentError(
      'INVALID_INPUT',
      `Invalid argument type for "${key}". Expected string.`,
      undefined,
      { fieldErrors: [{ field: key, message: 'Expected string.' }] },
    );
  }

  const normalized = trim ? value.trim() : value;
  if (minLength > 0 && normalized.length < minLength) {
    throw new MnemosAgentError(
      'INVALID_INPUT',
      `Argument "${key}" cannot be empty.`,
      undefined,
      { fieldErrors: [{ field: key, message: 'Cannot be empty.' }] },
    );
  }

  return normalized;
}

export function numberArg(
  args: Record<string, unknown>,
  key: string,
  options: { required?: boolean; min?: number; max?: number; integer?: boolean; default?: number } = {},
): number {
  const value = args[key];
  const required = options.required !== false;

  if (value === undefined || value === null) {
    if (options.default !== undefined) return options.default;
    if (!required) return NaN;
    throw new MnemosAgentError(
      'INVALID_INPUT',
      `Missing required argument: "${key}".`,
      undefined,
      { fieldErrors: [{ field: key, message: 'Required.' }] },
    );
  }

  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(n)) {
    throw new MnemosAgentError(
      'INVALID_INPUT',
      `Invalid argument type for "${key}". Expected number.`,
      undefined,
      { fieldErrors: [{ field: key, message: 'Expected number.' }] },
    );
  }

  if (options.integer && !Number.isInteger(n)) {
    throw new MnemosAgentError(
      'INVALID_INPUT',
      `Argument "${key}" must be an integer.`,
      undefined,
      { fieldErrors: [{ field: key, message: 'Expected integer.' }] },
    );
  }

  if (options.min !== undefined && n < options.min) {
    throw new MnemosAgentError(
      'INVALID_INPUT',
      `Argument "${key}" must be >= ${options.min}.`,
      undefined,
      { fieldErrors: [{ field: key, message: `Must be >= ${options.min}.` }] },
    );
  }

  if (options.max !== undefined && n > options.max) {
    throw new MnemosAgentError(
      'INVALID_INPUT',
      `Argument "${key}" must be <= ${options.max}.`,
      undefined,
      { fieldErrors: [{ field: key, message: `Must be <= ${options.max}.` }] },
    );
  }

  return n;
}

export function enumArg<T extends string>(
  args: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  options: { required?: boolean; default?: T } = {},
): T {
  const value = args[key];
  const required = options.required !== false;

  if (value === undefined || value === null || value === '') {
    if (options.default !== undefined) return options.default;
    if (!required) return allowed[0]!;
    throw new MnemosAgentError(
      'INVALID_INPUT',
      `Missing required argument: "${key}".`,
      undefined,
      { fieldErrors: [{ field: key, message: 'Required.' }] },
    );
  }

  if (typeof value !== 'string') {
    throw new MnemosAgentError(
      'INVALID_INPUT',
      `Invalid argument type for "${key}". Expected string.`,
      undefined,
      { fieldErrors: [{ field: key, message: 'Expected string.' }] },
    );
  }

  const normalized = value.trim() as T;
  if (!allowed.includes(normalized)) {
    throw new MnemosAgentError(
      'INVALID_INPUT',
      `Invalid value for "${key}". Expected one of: ${allowed.join(', ')}.`,
      undefined,
      { fieldErrors: [{ field: key, message: `Expected one of: ${allowed.join(', ')}.` }] },
    );
  }

  return normalized;
}
