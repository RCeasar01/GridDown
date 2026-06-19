const fs = require('fs');

// Fix 1: SettingsScreen "usb" icon → folder-open-outline
const settingsPath = 'E:/Projects/GridDown/app/screens/SettingsScreen.tsx';
let settings = fs.readFileSync(settingsPath, 'utf8');
settings = settings.replace('name="usb"', 'name="folder-open-outline"');
fs.writeFileSync(settingsPath, settings, 'utf8');
console.log('✓ SettingsScreen.tsx: usb → folder-open-outline');

// Fix 2: Create llama.rn type stub
fs.mkdirSync('E:/Projects/GridDown/types', { recursive: true });
const llamaTypes = `declare module 'llama.rn' {
  export interface LlamaContext {
    completion(
      params: {
        prompt: string;
        n_predict?: number;
        temperature?: number;
        top_p?: number;
        stop?: string[];
      },
      callback?: (data: { token: string }) => void
    ): Promise<{ text: string }>;
    release(): Promise<void>;
  }

  export function initLlama(params: {
    model: string;
    n_ctx?: number;
    n_gpu_layers?: number;
  }): Promise<LlamaContext>;

  export function getLlamaContext(): LlamaContext | null;
}
`;
fs.writeFileSync('E:/Projects/GridDown/types/llama.rn.d.ts', llamaTypes, 'utf8');
console.log('✓ types/llama.rn.d.ts created');

console.log('\nAll TS error fixes applied.');
