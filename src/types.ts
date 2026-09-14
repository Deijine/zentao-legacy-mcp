// ZenTao Legacy MCP - domain types.
// Interfaces for the business entities the MCP server exposes, plus the
// ApiResponse<T> envelope used by every tool handler.

// --- Business entities (field sets actually returned/used by the handlers) ---

export interface Product {
  id: number;
  name: string;
  code: string;
  status: string; // KB [api_675]: normal / open / hidden
  PO?: string;
  [k: string]: unknown;
}

export interface Story {
  id: number;
  title: string;
  status: string; // KB [api_695]: draft / active / closed / changed
  stage?: string; // KB [api_695]: wait/planned/projected/developing/developed/testing/tested/verified/released/closed
  pri?: number;
  estimate?: number;
  assignedTo?: string;
  product?: number;
  spec?: string;
  [k: string]: unknown;
}

export interface Bug {
  id: number;
  title: string;
  status: string; // KB [api_722]: active / resolved / closed
  severity?: number;
  pri?: number;
  assignedTo?: string;
  module?: number;
  openedBy?: string;
  openedDate?: string;
  resolution?: string;
  [k: string]: unknown;
}

export interface TestCase {
  id: number;
  title: string;
  status?: string;
  pri?: number;
  type?: string;
  product?: number;
  precondition?: string;
  steps?: string | { step: string; expect: string }[];
  [k: string]: unknown;
}

// --- Tool result envelope ---
// Success: { data: T }
// Failure: { error: { message: string; code: string } }
// The MCP layer wraps these with isError:true on failure.
export type ToolError = { error: { message: string; code: string } };
export type ToolSuccess<T> = { data: T };
export type ApiResponse<T> = ToolSuccess<T> | ToolError;

// A generic "ok" helper type for handler return values.
export type HandlerResult<T> = ApiResponse<T>;
