// Stub declarations for packages not yet installed
// These allow tsc to compile without errors until packages are added via npm install

declare module 'i18next' {
  const i18n: {
    use(plugin: any): any;
    init(options: any): Promise<any>;
    t(key: string, options?: any): string;
    changeLanguage(lng: string): Promise<any>;
    language: string;
  };
  export default i18n;
  export type TFunction = (key: string, options?: any) => string;
}

declare module 'react-i18next' {
  import { TFunction } from 'i18next';
  export function useTranslation(ns?: string): { t: TFunction; i18n: any };
  export function initReactI18next(): any;
  export const initReactI18next: any;
  export function Trans(props: any): any;
}

declare module 'expo-localization' {
  export const locale: string;
  export const locales: string[];
  export const timezone: string;
  export const isRTL: boolean;
  export function getLocales(): Array<{ languageCode: string; regionCode: string; languageTag: string }>;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<string[]>;
    multiGet(keys: string[]): Promise<[string, string | null][]>;
    multiSet(keyValuePairs: [string, string][]): Promise<void>;
    multiRemove(keys: string[]): Promise<void>;
  };
  export default AsyncStorage;
}

declare module 'react-native-svg' {
  import React from 'react';
  interface SvgProps {
    width?: number | string;
    height?: number | string;
    viewBox?: string;
    fill?: string;
    stroke?: string;
    [key: string]: any;
  }
  const Svg: React.FC<SvgProps>;
  export default Svg;
  export const Path: React.FC<{ [key: string]: any }>;
  export const Circle: React.FC<{ [key: string]: any }>;
  export const Line: React.FC<{ [key: string]: any }>;
  export const Rect: React.FC<{ [key: string]: any }>;
  export const Ellipse: React.FC<{ [key: string]: any }>;
  export const G: React.FC<{ [key: string]: any }>;
  export const Text: React.FC<{ [key: string]: any }>;
  export const Polygon: React.FC<{ [key: string]: any }>;
  export const Polyline: React.FC<{ [key: string]: any }>;
  export const Defs: React.FC<{ [key: string]: any }>;
  export const ClipPath: React.FC<{ [key: string]: any }>;
  export const LinearGradient: React.FC<{ [key: string]: any }>;
  export const Stop: React.FC<{ [key: string]: any }>;
}
