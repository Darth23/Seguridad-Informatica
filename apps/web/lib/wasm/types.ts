/**
 * Type definitions for WASM module responses and interfaces
 */

/**
 * Command response structure returned by WASM functions
 */
export interface CommandResponse {
  success: boolean;
  output: string;
  error?: string | null;
}

/**
 * Parsed command with name and arguments
 */
export interface ParsedCommand {
  command: string;
  args: string[];
  rawArgs: string;
}

/**
 * WASM module initialization options
 */
export interface WasmInitOptions {
  /** Path to the WASM file */
  wasmPath?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Timeout for WASM loading in milliseconds */
  timeout?: number;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  operation: string;
  clientId: string;
  current: number;
  limit: number;
  remaining: number;
  windowMs: number;
}

/**
 * File system entry
 */
export interface FileSystemEntry {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  modified?: Date;
}

/**
 * Log analysis result
 */
export interface LogAnalysisResult {
  totalLines: number;
  levels: {
    error: number;
    warning: number;
    info: number;
    debug: number;
  };
  ipAddresses: string[];
  timestamps: {
    first?: string;
    last?: string;
  };
}

/**
 * Crypto operation result
 */
export interface CryptoResult {
  algorithm: string;
  input: string;
  output: string;
  timestamp: number;
}

/**
 * Network scan result
 */
export interface ScanResult {
  host: string;
  ports: PortInfo[];
  latency?: number;
}

/**
 * Port information from network scan
 */
export interface PortInfo {
  port: number;
  protocol: string;
  state: 'open' | 'closed' | 'filtered';
  service?: string;
}

/**
 * Flag validation result
 */
export interface FlagValidationResult {
  valid: boolean;
  flag: string;
  points?: number;
  hash?: string;
  message: string;
}

/**
 * Error types that can be returned by WASM operations
 */
export type WasmErrorType =
  | 'INVALID_ARGUMENTS'
  | 'OPERATION_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'PARSE_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

/**
 * Extended error with type information
 */
export interface WasmError extends Error {
  type: WasmErrorType;
  code?: number;
  details?: Record<string, unknown>;
}

/**
 * Utility function to check if a response is an error
 */
export function isError(response: CommandResponse): boolean {
  return !response.success || !!response.error;
}

/**
 * Utility function to extract error message from response
 */
export function getErrorMessage(response: CommandResponse): string | null {
  if (response.error) {
    return response.error;
  }
  if (!response.success) {
    return 'Operation failed without specific error message';
  }
  return null;
}

/**
 * Parse a command string into command name and arguments
 */
export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);
  const command = parts[0] || '';
  const args = parts.slice(1);
  
  return {
    command,
    args,
    rawArgs: args.join(' '),
  };
}

/**
 * Strip ANSI escape codes from a string
 */
export function stripAnsiCodes(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Format a CommandResponse for terminal display
 */
export function formatForTerminal(response: CommandResponse): string {
  if (!response.success) {
    return `\x1b[31mError: ${response.error || 'Unknown error'}\x1b[0m`;
  }
  return response.output;
}
