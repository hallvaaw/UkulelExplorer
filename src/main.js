import { CHORD_LIBRARY } from './chordLibrary.js';
const { invoke } = window.__TAURI__.core;

const NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const TOGGLED_NOTES = ["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"];
const FLATS = ["D♭","E♭","G♭","A♭","B♭"];
const SHARPS = ["C#","D#","F#","G#","A#"];
const NUM_FRETS = Array.from({ length:13 }, (_,i) => i);
const STRING_NAMES = ["A","E","C","G"];

let accidentalMode = "flat";
let renderFlats = false;
let tuning = "GCEA";

let selectedChord = null;
let selectedSubChord = null;

let A_STRING=[], E_STRING=[], C_STRING=[], G_STRING=[], STRINGS=[];

function convertNote(note, mode){
  if(mode==="flat" && note.includes("#")){
    const idx = SHARPS.indexOf(note);
    return idx!==-1 ? FLATS[idx] : note;
  }
  if(mode==="sharp" && FLATS.includes(note)){
    const idx = FLATS.indexOf(note);
    return idx!==-1 ? SHARPS[idx] : note;
  }
  return note;
}

function toggleAccidentals(input, mode){
  if(typeof input==="string") return convertNote(input, mode);
  if(Array.isArray(input)) return input.map(n=>convertNote(n, mode));
  return input;
}

function normalizeToSharp(note){
  const idx = FLATS.indexOf(note);
  return idx!==-1 ? SHARPS[idx] : note;
}

function chordNotes(){
  if(!selectedChord || !selectedSubChord) return [];
  return CHORD_LIBRARY[selectedChord]?.[selectedSubChord] || [];
}

function noteAt(index){ return NOTES[(index + NOTES.length) % NOTES.length]; }
function stringNotes(frets,startIndex){
  const notes=[];
  for(let i=startIndex;i<startIndex+frets;i++) notes.push(noteAt(i));
  return notes;
}

function tuneStart(){
  A_STRING = stringNotes(14,9);
  E_STRING = stringNotes(14,4);
  C_STRING = stringNotes(14,0);
  G_STRING = stringNotes(14,7);
  STRINGS = [A_STRING, E_STRING, C_STRING, G_STRING];
}
tuneStart();

const fretContainer = document.getElementById('fret-numbers');
NUM_FRETS.forEach(fret=>{
  const div = document.createElement('div');
  div.className = 'grid text-neutral-300 shrink-0 py-2 w-25 text-end';
  if([3,5,7,10].includes(fret)) div.classList.add('font-bold','text-white','text-xl');
  div.textContent = fret;
  fretContainer.appendChild(div);
});

const stringsContainer = document.getElementById('strings-container');
STRINGS.forEach((notes,stringIndex)=>{
  const row = document.createElement('div');
  row.className='flex items-center';
  notes.forEach(note=>{
    const div = document.createElement('div');
    div.textContent = toggleAccidentals(note, accidentalMode);
    div.className='w-25 text-center border-r py-2';
    row.appendChild(div);
  });
  stringsContainer.appendChild(row);
});

let greetInputEl, greetMsgEl;
async function greet(){
  greetMsgEl.textContent = await invoke('greet', { name: greetInputEl.value });
}
window.addEventListener('DOMContentLoaded', ()=>{
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
});

