const attempts=new Map<string,{count:number;reset:number}>();
export function allowAttempt(key:string,limit=8,windowMs=60_000){const now=Date.now();const item=attempts.get(key);if(!item||item.reset<now){attempts.set(key,{count:1,reset:now+windowMs});return true}if(item.count>=limit)return false;item.count++;return true}
