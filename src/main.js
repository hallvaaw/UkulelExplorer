import { CHORD_LIBRARY } from './chordLibrary.js';
const { invoke } = window.__TAURI__.core;

const NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const TOGGLED_NOTES = ["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"];
const FLATS = ["D♭","E♭","G♭","A♭","B♭"];
const SHARPS = ["C#","D#","F#","G#","A#"];
const NUM_FRETS = Array.from({ length:13 }, (_,i) => i);
const stringNames = ['A_STRING', 'E_STRING', 'C_STRING', 'G_STRING'];
const stringKeys = ['A', 'E', 'C', 'G'];

let accidentalMode = "flat";
let renderFlats = false;
let tuning = "GCEA";

let selectedChord = null;
let selectedSubChord = null;

let A_STRING=[], E_STRING=[], C_STRING=[], G_STRING=[];

function convertNote(note, mode){
  if (mode === "flat" && note.includes("#")){
    const index = SHARPS.indexOf(note);
    return index !== -1 ? FLATS[index] : note;
  }
  if (mode === "sharp" && FLATS.includes(note)){
    const index = FLATS.indexOf(note);
    return index !== -1 ? SHARPS[index] : note;
  }
  return note;
}

function toggleAccidentals(input, mode){
  if (typeof input==="string") return convertNote(input, mode);
  if (Array.isArray(input)) return input.map(n => convertNote(n, mode));
  return input;
}

function toggleAccidental(note, mode) {
  if (mode === "flat" && note.includes("#")) {
    const index = SHARPS.indexOf(note);
    return index !== -1 ? FLATS[index] : note;
  }

  if (mode === "sharp" && FLATS.includes(note)) {
    const index = FLATS.indexOf(note);
    return index !== -1 ? SHARPS[index] : note;
  }

  return note;
}

function normalizeToSharp(note){
  const index = FLATS.indexOf(note);
  return index !== -1 ? SHARPS[index] : note;
}

function setTone(c) {
    selectedChord.value = normalizeToSharp(c)
    return selectedChord
}

function setChord(d) {
    selectedSubChord.value = d

    return selectedChord, selectedSubChord
}

function chordNotes(){
  if (!selectedChord || !selectedSubChord) return [];
  return CHORD_LIBRARY[selectedChord]?.[selectedSubChord] || [];
}

let tuningValue = null;

function noteAt(index){ return NOTES[(index + NOTES.length) % NOTES.length]; }

function stringNotes(frets, startIndex){
  const notes=[];
  for (let i = startIndex;i < startIndex+frets; i++) notes.push(noteAt(i));
  return notes;
}

let tuningOffsets = {
  A: 0,
  E: 0,
  C: 0,
  G: 0,
};

let tuningValues = {
  A: 0,
  E: 0,
  C: 0,
  G: 0,
};


function displayAString() {
  return toggleAccidentals(A_STRING, accidentalMode)
}

function displayEString() {
  return toggleAccidentals(E_STRING, accidentalMode)
}

function displayCString() {
  return toggleAccidentals(C_STRING, accidentalMode)
}

function displayGString() {
  return toggleAccidentals(G_STRING, accidentalMode)
}

let STRINGS = [
  A_STRING.value,
  E_STRING.value,
  C_STRING.value,
  G_STRING.value,
];

const STRING_OBJECTS = {
  A: A_STRING,
  E: E_STRING,
  C: C_STRING,
  G: G_STRING
};

function tuneStart(){
  A_STRING = stringNotes(14, 9);
  E_STRING = stringNotes(14, 4);
  C_STRING = stringNotes(14, 0);
  G_STRING = stringNotes(14, 7);
  STRINGS = [A_STRING, E_STRING, C_STRING, G_STRING];

  tuning = "GCEA"
}

tuneStart();

function getBaseTunings() {
  return {
    A: NOTES.indexOf(A_STRING[0]),
    E: NOTES.indexOf(E_STRING[0]),
    C: NOTES.indexOf(C_STRING[0]),
    G: NOTES.indexOf(G_STRING[0]),
  }
}

const baseTunings = getBaseTunings()

function toggleMode() {
    accidentalMode.value = accidentalMode.value === "sharp" ? "flat" : "sharp";
    renderFlats.value = !renderFlats.value
}

const mainTunings = {
    GCEA: { A: 9, E: 4, C: 0, G: 7 },
    ADFsB: { A: 11, E: 6, C: 2, G: 9 },
    DGBE: { A: 4, E: 11, C: 7, G: 2 },
    FAsDG: { A: 7, E: 2, C: 10, G: 5 },
}

function tuneFunction(tuningData) {
  for (const [key, value] of Object.entries(tuningData)) {
    STRING_OBJECTS[key].value = stringNotes(14, value);
  }

  STRINGS.value = [
    A_STRING.value,
    E_STRING.value,
    C_STRING.value,
    G_STRING.value,
  ];

  for (const [key, value_] of Object.entries(tuningData)) {
    baseTunings[key] = value_
    tuningOffsets[key] = 0
    tuningValues[key] = 0
  }

  accidentalMode = "sharp"
}

function tuneGCEA() {
  const tuningData = mainTunings["GCEA"]
  tuning = "GCEA";
  tuneFunction(tuningData)
}

tuneGCEA();

function tuneDGBE() {
  const tuningData = mainTunings["DGBE"]
  tuning = "DGBE";
  tuneFunction(tuningData)
}

function tuneADFsB() {
  const tuningData = mainTunings["ADFsB"]
  tuning = "ADFsB";
  tuneFunction(tuningData)
}

function tuneFAsDG() {
  const tuningData = mainTunings["FAsDG"]
  tuning = "FAsDG";
  tuneFunction(tuningData)
}

function tuneString(name, direction = "up", tuneSet) {
  console.log(tuningOffsets[name])
  tuningOffsets[name] += direction === "up" ? 1 : -1;
  tuningValues[name] += direction === "up" ? 1 : -1;
  if (Math.abs(tuningOffsets[name]) === 12) {
        tuningOffsets[name] = 0
  }

  const newStart = baseTunings[name] + tuningOffsets[name];

  switch (name) {
    case "A":
      A_STRING.value = stringNotes(14, newStart);
      break;
    case "E":
      E_STRING.value = stringNotes(14, newStart);
      break;
    case "C":
      C_STRING.value = stringNotes(14, newStart);
      break;
    case "G":
      G_STRING.value = stringNotes(14, newStart);
      break;
  }

  STRINGS.value = [
    A_STRING.value,
    E_STRING.value,
    C_STRING.value,
    G_STRING.value,
  ];

}

const fretContainer = document.getElementById('fret-numbers');
NUM_FRETS.forEach(fret => {
  const div = document.createElement('div');
  div.className = 'grid text-neutral-300 shrink-0 py-2 w-25 text-end';
  if ([3,5,7,10].includes(fret)) div.classList.add('font-bold','text-white','text-xl');
  div.textContent = fret;
  fretContainer.appendChild(div);
});

const stringsContainer = document.getElementById('strings-container');
stringsContainer.innerHTML = ''



STRINGS.forEach((notes, stringIndex) => {
    const offset = Object.values(tuningOffsets)[stringIndex]
    const row = document.createElement('div');
    row.className='flex items-center';

    const p = document.createElement('p');
    p.className = 'w-2 mx-4 text-neutral-400 font-bold'
    p.textContent = offset

    if (Math.abs(offset) > 0) {
        p.classList.add('text-white')
    }

    const downBtn = document.createElement('button')
    downBtn.textContent = '←'
    downBtn.className = 'bg-blue-600 text-white font-bold px-2 py-1 rounded hover:bg-blue-700 mr-1'

    downBtn.addEventListener('click', () => {
        console.log(stringKeys[stringIndex])
        tuneString(stringKeys[stringIndex], 'down', tuning)
    })

    const upBtn = document.createElement('button')
    upBtn.textContent = '→'
    upBtn.className = 'bg-blue-600 text-white font-bold px-2 py-1 rounded hover:bg-blue-700 mx-1'

    upBtn.addEventListener('click', () => {
        tuneString(stringKeys[stringIndex], 'up', tuning)
    })

    row.append(p, downBtn, upBtn)

    notes.forEach(note => {
        const div = document.createElement('div');
        div.textContent = toggleAccidentals(note, accidentalMode);
        div.className='w-25 text-center border-r py-2';
        row.appendChild(div);
    });

    stringsContainer.appendChild(row);
});
