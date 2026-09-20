/// <reference types="vite/client" />

/** Vite rewrites this base for repository-hosted builds; GLTFLoader URLs need it explicitly. */
export const worldAsset = (filename: string): string => `${import.meta.env.BASE_URL}assets/${filename}`;
