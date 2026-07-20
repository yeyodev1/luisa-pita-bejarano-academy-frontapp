/// <reference types="vite/client" />

interface Window {
  cloudinary?: {
    createUploadWidget: (options: Record<string, unknown>, callback: (error: unknown, result: any) => void) => { open: () => void; close: () => void }
  }
}

// Meta Pixel global
declare function fbq(command: string, event: string, params?: Record<string, unknown>): void;
declare function fbq(command: 'init', pixelId: string): void;

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}
