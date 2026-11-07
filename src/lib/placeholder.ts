export const isPlaceholder = (text: string): boolean => text.includes('[PLACEHOLDER');

export const showPlaceholders: boolean = import.meta.env.DEV;
