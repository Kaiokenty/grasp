export const CATEGORIES = ['Work', 'Personal', 'Shopping', 'Health', 'Ideas', 'Other'] as const;
export const URGENCIES = ['High', 'Medium', 'Low'] as const;
export type Category = typeof CATEGORIES[number];
export type Urgency = typeof URGENCIES[number];
