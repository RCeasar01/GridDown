declare module 'llama.rn' {
  export interface LlamaContext {
    completion(
      params: {
        prompt?: string;
        messages?: Array<{ role: string; content: string }>;
        n_predict?: number;
        temperature?: number;
        top_p?: number;
        stop?: string[];
        [key: string]: unknown;
      },
      callback?: (data: { token: string }) => void
    ): Promise<{ text: string }>;
    release(): Promise<void>;
  }

  export function initLlama(params: {
    model: string;
    n_ctx?: number;
    n_gpu_layers?: number;
    n_batch?: number;
    [key: string]: unknown;
  }): Promise<LlamaContext>;

  export function getLlamaContext(): LlamaContext | null;
}
