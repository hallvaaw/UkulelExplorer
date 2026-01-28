const { invoke } = window.__TAURI__.core;

let greetInputEl;
let greetMsgEl;

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}

window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form").addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });
});

import { CHORD_LIBRARY } from '../chordLibrary.js'

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const TOGGLED_NOTES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"]
const NOTES_PER_OCTAVE = NOTES.length;
const STRING_NOTES = ["A", "E", "C", "G"]
const SUBNOTES = ["Major", "Minor", "7", "maj7", "m7", "dim", "aug"]
const FLATS = ["D♭", "E♭", "G♭", "A♭", "B♭"]
const SHARPS = ["C#", "D#", "F#", "G#","A#"]

let accidentalMode = ref("flat")
let renderFlats = ref(false);
// toggleAccidentals(NOTES, accidentalMode.value === "flat" ? "flat" : "sharp")

function convertNote(note, mode) {
  if (mode === "flat" && note.includes("#")) {
    const index = SHARPS.indexOf(note);
    return index !== -1 ? FLATS[index] : note;
  }

  if (mode === "sharp" && FLATS.includes(note)) {
    const index = FLATS.indexOf(note);
    return SHARPS[index];
  }

  return note;
}

function toggleAccidentals(input, mode) {
  if (typeof input === "string") {
    return convertNote(input, mode);
  }

  if (Array.isArray(input)) {
    return input.map(note => convertNote(note, mode));
  }

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


const windowWidth = ref(window.innerWidth)

let selectedChord = ref()
let selectedSubChord = ref()
const showChord = ref(true)
const stringNames = ['A_STRING', 'E_STRING', 'C_STRING', 'G_STRING'];

const NUM_FRETS = [...Array(13).keys()]

function normalizeToSharp(note) {
  const index = FLATS.indexOf(note);
  return index !== -1 ? SHARPS[index] : note;
}

function setTone(c) {
    selectedChord.value = normalizeToSharp(c)

    return selectedChord
}

function findFirstOnString(stringNotes, remainingNotes, allChordNotes) {
  const chordSet = allChordNotes
  let diff;
  for (let fretIndex = 0; fretIndex < stringNotes.length; fretIndex++) {

    const note = stringNotes[fretIndex];
    const noteIndex = remainingNotes.indexOf(note);
    if (noteIndex !== -1) {
      remainingNotes.splice(noteIndex, 1);
      // diff = fretIndex[n] - fretIndex[n-1]
      // if (diff > 2)
      console.log(note)
      return { fretIndex, note }
    }
  }
    for (let fretIndex = 0; fretIndex < stringNotes.length; fretIndex++) {
        const note = stringNotes[fretIndex];

        if (chordSet.includes(note)) {
          return { fretIndex, note };
        }
}

  return null;
}

function setChord(d) {
    selectedSubChord.value = d

    return selectedChord, selectedSubChord
}

const chordNotes = computed(() => {
  if (!selectedChord.value || !selectedSubChord.value) return [];

  return (
    CHORD_LIBRARY[selectedChord.value][selectedSubChord.value] || []
  );
});

const firstChordPositions = computed(() => {
  if (!selectedChord.value || !selectedSubChord.value) return [];

  const chordNotes = CHORD_LIBRARY[selectedChord.value][selectedSubChord.value];
  const remainingNotes = [...chordNotes];
  const positions = [];

  for (let stringIndex = 0; stringIndex < STRINGS.value.length; stringIndex++) {
    const result = findFirstOnString(
      STRINGS.value[stringIndex],
      remainingNotes,
      chordNotes
    );

    if (result) {
      positions.push({
        stringIndex,
        fretIndex: result.fretIndex,
        note: result.note,
      });
    }
  }

  return positions;
});

const allChordPositions = computed(() => {
  const notes = chordNotes.value;
  const positions = [];

  STRINGS.value.forEach((string, stringIndex) => {
    string.forEach((note, fretIndex) => {
      if (notes.includes(note)) {
        positions.push({ stringIndex, fretIndex });
      }
    });
  });

  return positions;
});

function displayNote(note) {
  return accidentalMode.value === "flat" ? toggleAccidental(note, "flat") : note;
}

const displayChordNotes = computed(() => {
  return toggleAccidentals(chordNotes.value, accidentalMode.value === "flat" ? "flat" : "sharp");
});

const renderNotes = computed(() => !renderFlats.value)

const displayToggledTones = computed(() => {
  return renderFlats.value ? TOGGLED_NOTES : NOTES
});

let tuningValue = ref(0);

function noteAt(index) {
  return NOTES[(index + NOTES_PER_OCTAVE) % NOTES_PER_OCTAVE];
}

function stringNotes(frets, startIndex) {
  const notes = [];
  for (let i = startIndex; i < startIndex + frets; i++) {
    notes.push(noteAt(i));
  }
  return notes;
}

const tuningOffsets = ref({
  A: 0,
  E: 0,
  C: 0,
  G: 0,
});

let tuningValues = ref({
  A: 0,
  E: 0,
  C: 0,
  G: 0,
});

let tuning = "GCEA";

const A_STRING = ref();
const E_STRING = ref();
const C_STRING = ref();
const G_STRING = ref();

const displayAString = computed(() =>
  toggleAccidentals(A_STRING.value, accidentalMode.value)
);

const displayEString = computed(() =>
  toggleAccidentals(E_STRING.value, accidentalMode.value)
);

const displayCString = computed(() =>
  toggleAccidentals(C_STRING.value, accidentalMode.value)
);

const displayGString = computed(() =>
  toggleAccidentals(G_STRING.value, accidentalMode.value)
);

const STRINGS = ref([
  A_STRING.value,
  E_STRING.value,
  C_STRING.value,
  G_STRING.value,
]);

const STRING_OBJECTS = {
  A: A_STRING,
  E: E_STRING,
  C: C_STRING,
  G: G_STRING
};

function tuneStart() {
  A_STRING.value = stringNotes(14, 9)
  E_STRING.value = stringNotes(14, 4)
  C_STRING.value = stringNotes(14, 0)
  G_STRING.value = stringNotes(14, 7)

  STRINGS.value = [
    A_STRING.value,
    E_STRING.value,
    C_STRING.value,
    G_STRING.value,
  ];

  tuning = "GCEA";
}

tuneStart()

let baseTunings = reactive({
  A: NOTES.indexOf(A_STRING.value[0]),
  E: NOTES.indexOf(E_STRING.value[0]),
  C: NOTES.indexOf(C_STRING.value[0]),
  G: NOTES.indexOf(G_STRING.value[0]),
});

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
    tuningOffsets.value[key] = 0
    tuningValues.value[key] = 0
  }

  accidentalMode.value = "sharp"
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
  tuningOffsets.value[name] += direction === "up" ? 1 : -1;
  tuningValues.value[name] += direction === "up" ? 1 : -1;
  if (Math.abs(tuningOffsets.value[name]) === 12) {
        tuningOffsets.value[name] = 0
  }

  const newStart = baseTunings[name] + tuningOffsets.value[name];

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
