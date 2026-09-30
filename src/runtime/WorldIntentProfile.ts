export type WorldTheme="default"|"forest"|"desert"|"ice"|"space";
export type WorldScale="small"|"medium"|"large"|"huge";
export type WorldDifficulty="easy"|"normal"|"hard";
export type WorldDensity="low"|"normal"|"high";
export type WorldIntentProfile={theme:WorldTheme;scale:WorldScale;difficulty:WorldDifficulty;density:WorldDensity};
export function parseWorldIntentProfile(raw:string):WorldIntentProfile{const q=raw.toLowerCase();return{theme:/floresta|forest|selva/.test(q)?"forest":/deserto|desert/.test(q)?"desert":/gelo|neve|ice|snow/.test(q)?"ice":/espaço|espaco|space|gal[aá]xia/.test(q)?"space":"default",scale:/enorme|gigante|huge|massive/.test(q)?"huge":/grande|large/.test(q)?"large":/pequeno|small/.test(q)?"small":"medium",difficulty:/dif[ií]cil|hard/.test(q)?"hard":/f[aá]cil|easy/.test(q)?"easy":"normal",density:/muitos|muitas|lot of|dense/.test(q)?"high":/poucos|poucas|few/.test(q)?"low":"normal"}}
