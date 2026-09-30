export type PhaserAutosaveEvent="damage"|"loot"|"enemy-reward"|"quest"|"shop"|"turn-in"|"portal"|"dialogue";
const persistent=new Set<PhaserAutosaveEvent>(["damage","loot","enemy-reward","quest","shop","turn-in","portal"]);
export const shouldAutosave=(event:PhaserAutosaveEvent)=>persistent.has(event);
