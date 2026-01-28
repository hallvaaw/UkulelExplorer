
const { invoke } = window.__TAURI__.core;

import { CHORD_LIBRARY } from '../chordLibrary.js'

const NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const TOGGLED_NOTES = ["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"];
const NOTES_PER_OCTAVE = NOTES.length;
const STRING_NAMES = ["A","E","C","G"];
const SUBNOTES = ["Major","Minor","7","maj7","m7","dim","aug"];
const FLATS = ["D♭","E♭","G♭","A♭","B♭"];
const SHARPS = ["C#","D#","F#","G#","A#"];
const NUM_FRETS = Array.from({length:13}, (_,i)=>i);

let accidentalMode = "flat";
let renderFlats = false;

let selectedChord = null;
let selectedSubChord = null;
let showChord = true;

let tuning = "GCEA";
let tuningOffsets = { A:0, E:0, C:0, G:0 };
let tuningValues = { A:0, E:0, C:0, G:0 };
let baseTunings = {};

let A_STRING = [];
let E_STRING = [];
let C_STRING = [];
let G_STRING = [];
let STRINGS = [];

function convertNote(note, mode) {
  if(mode === "flat" && note.includes("#")){
    const idx = SHARPS.indexOf(note);
    return idx !== -1 ? FLATS[idx] : note;
  }
  if(mode === "sharp" && FLATS.includes(note)){
    const idx = FLATS.indexOf(note);
    return idx !== -1 ? SHARPS[idx] : note;
  }
  return note;
}

function toggleAccidentals(input, mode){
  if(typeof input === "string") return convertNote(input, mode);
  if(Array.isArray(input)) return input.map(n=>convertNote(n, mode));
  return input;
}

function normalizeToSharp(note){
  const idx = FLATS.indexOf(note);
  return idx !== -1 ? SHARPS[idx] : note;
}

function setTone(chord){
  selectedChord = normalizeToSharp(chord);
}

function setChord(subChord){
  selectedSubChord = subChord;
}

function chordNotes(){
  if(!selectedChord || !selectedSubChord) return [];
  return CHORD_LIBRARY[selectedChord]?.[selectedSubChord] || [];
}

function findFirstOnString(stringNotes, remainingNotes, allChordNotes){
  for(let fretIndex=0; fretIndex<stringNotes.length; fretIndex++){
    const note = stringNotes[fretIndex];
    const idx = remainingNotes.indexOf(note);
    if(idx !== -1){
      remainingNotes.splice(idx,1);
      return {fretIndex, note};
    }
  }
  for(let fretIndex=0; fretIndex<stringNotes.length; fretIndex++){
    const note = stringNotes[fretIndex];
    if(allChordNotes.includes(note)) return {fretIndex, note};
  }
  return null;
}

function firstChordPositions(){
  if(!selectedChord || !selectedSubChord) return [];
  const chordNotesArr = chordNotes();
  const remaining = [...chordNotesArr];
  const positions = [];

  STRINGS.forEach((stringNotes, stringIndex)=>{
    const res = findFirstOnString(stringNotes, remaining, chordNotesArr);
    if(res) positions.push({ stringIndex, fretIndex: res.fretIndex, note: res.note });
  });
  return positions;
}

function allChordPositions(){
  const notes = chordNotes();
  const positions = [];
  STRINGS.forEach((stringNotes,stringIndex)=>{
    stringNotes.forEach((note,fretIndex)=>{
      if(notes.includes(note)) positions.push({ stringIndex, fretIndex });
    });
  });
  return positions;
}

function displayNote(note){
  return accidentalMode==="flat"? toggleAccidentals(note,"flat") : note;
}

function displayChordNotes(){
  return toggleAccidentals(chordNotes(), accidentalMode==="flat" ? "flat" : "sharp");
}

function displayToggledTones(){
  return renderFlats ? TOGGLED_NOTES : NOTES;
}

function noteAt(index){
  return NOTES[(index + NOTES_PER_OCTAVE) % NOTES_PER_OCTAVE];
}

function stringNotes(frets, startIndex){
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
  tuning = "GCEA";

  baseTunings = {
    A: NOTES.indexOf(A_STRING[0]),
    E: NOTES.indexOf(E_STRING[0]),
    C: NOTES.indexOf(C_STRING[0]),
    G: NOTES.indexOf(G_STRING[0])
  };
}

tuneStart();

const mainTunings = {
  GCEA: { A:9, E:4, C:0, G:7 },
  ADFsB: { A:11, E:6, C:2, G:9 },
  DGBE: { A:4, E:11, C:7, G:2 },
  FAsDG: { A:7, E:2, C:10, G:5 }
};

function tuneFunction(tuningData){
  for(const [key,value] of Object.entries(tuningData)){
    switch(key){
      case "A": A_STRING = stringNotes(14,value); break;
      case "E": E_STRING = stringNotes(14,value); break;
      case "C": C_STRING = stringNotes(14,value); break;
      case "G": G_STRING = stringNotes(14,value); break;
    }
  }
  STRINGS = [A_STRING, E_STRING, C_STRING, G_STRING];

  for(const [key,value_] of Object.entries(tuningData)){
    baseTunings[key] = value_;
    tuningOffsets[key] = 0;
    tuningValues[key] = 0;
  }

  accidentalMode = "sharp";
}

function tuneGCEA(){ tuning="GCEA"; tuneFunction(mainTunings["GCEA"]); }
function tuneDGBE(){ tuning="DGBE"; tuneFunction(mainTunings["DGBE"]); }
function tuneADFsB(){ tuning="ADFsB"; tuneFunction(mainTunings["ADFsB"]); }
function tuneFAsDG(){ tuning="FAsDG"; tuneFunction(mainTunings["FAsDG"]); }

tuneGCEA();

function tuneString(name, direction="up"){
  tuningOffsets[name] += (direction==="up"?1:-1);
  tuningValues[name] += (direction==="up"?1:-1);
  if(Math.abs(tuningOffsets[name])===12) tuningOffsets[name]=0;

  const newStart = baseTunings[name] + tuningOffsets[name];
  switch(name){
    case "A": A_STRING = stringNotes(14,newStart); break;
    case "E": E_STRING = stringNotes(14,newStart); break;
    case "C": C_STRING = stringNotes(14,newStart); break;
    case "G": G_STRING = stringNotes(14,newStart); break;
  }
  STRINGS = [A_STRING, E_STRING, C_STRING, G_STRING];
}

function toggleMode(){
  accidentalMode = (accidentalMode==="sharp")?"flat":"sharp";
  renderFlats = !renderFlats;
}

let greetInputEl, greetMsgEl;

async function greet(){
  greetMsgEl.textContent = await invoke("greet",{ name: greetInputEl.value });
}

window.addEventListener("DOMContentLoaded", ()=>{
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form").addEventListener("submit",(e)=>{
    e.preventDefault();
    greet();
  });
});

