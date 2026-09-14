"use client";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

export const THEME_KEY="alkebulan-theme";
const THEME_EVENT="alkebulan-theme-change";

/** Applies the stored or system theme before hydration so there is no flash of the wrong mode. */
export const themeInitScript=`try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}`;

const subscribe=(onStoreChange:()=>void)=>{
 window.addEventListener(THEME_EVENT,onStoreChange);
 window.addEventListener("storage",onStoreChange);
 return ()=>{window.removeEventListener(THEME_EVENT,onStoreChange);window.removeEventListener("storage",onStoreChange)};
};
const getSnapshot=()=>document.documentElement.classList.contains("dark");
const getServerSnapshot=()=>false;

export function ThemeToggle({className}:{className?:string}){
 const dark=useSyncExternalStore(subscribe,getSnapshot,getServerSnapshot);
 const toggle=()=>{
  const next=!dark;
  document.documentElement.classList.toggle("dark",next);
  try{localStorage.setItem(THEME_KEY,next?"dark":"light")}catch{/* storage unavailable */}
  window.dispatchEvent(new Event(THEME_EVENT));
 };
 const label=dark?"Switch to light mode":"Switch to dark mode";
 return <button type="button" onClick={toggle} aria-label={label} title={label} className={className}>
  <Sun className={dark?"hidden":"size-[18px]"}/>
  <Moon className={dark?"size-[18px]":"hidden"}/>
 </button>;
}
