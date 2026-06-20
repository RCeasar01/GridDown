// Type declarations for llama.rn (on-device LLM runtime)
// Installed at runtime only — these stubs satisfy TypeScript
declare module 'llama.rn' {
  export interface LlamaContext {
    completion(params: {
      messages: Array<{ role: string; content: string }>;
      n_predict?: number;
      temperature?: number;
    }): Promise<{ text: string }>;
  }

  export function initLlama(config: {
    model: string;
    n_ctx?: number;
    n_batch?: number;
  }): Promise<LlamaContext>;

  export function getLlamaContext(): LlamaContext | null;
}
