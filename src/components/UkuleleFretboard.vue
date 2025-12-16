<template>
  <div class="container p-2">
    <div class="flex flex-col cursor-default">
        <div class="overflow-x-auto">
      <div class="flex ml-16">
        <div v-for="fret in NUM_FRETS" class="grid text-neutral-300 shrink-0 py-2 w-25 text-end items-center" :class="{'font-bold text-white text-xl' : fret === 3 || fret === 5 || fret === 7 || fret === 10}">
        {{ fret }}
        </div>
      </div>
      <div v-for="(stri, stringIndex) in STRINGS" :key="stringIndex" class="flex items-center">
        <p class="w-2 mx-4 text-neutral-400 font-bold" :class="{'text-white' : Math.abs(Object.values(tuningOffsets)[stringIndex]) > 0}">{{ Object.values(tuningOffsets)[stringIndex] }}</p>
        <button @click="tuneString(Object.keys(baseTunings)[stringIndex], 'down', tuning)"
                class="bg-blue-600 text-white font-bold px-2 py-1 rounded hover:bg-blue-700 mr-1">←</button>
        <button @click="tuneString(Object.keys(baseTunings)[stringIndex], 'up', tuning)"
                class="bg-blue-600 text-white font-bold px-2 py-1 rounded hover:bg-blue-700 mx-1">→</button>
        <div class="flex">
          <div v-for="(fret, i) in NUM_FRETS" :key="i" class="grid grid-cols-3 text-white shrink-0 font-bold py-2 w-25 border-r border-neutral-400 text-center items-center">
            <div class="h-[1px] bg-neutral-500" :class="{'bg-neutral-900' : i === 0}"></div>
            <div class="px-3 pr-6 py-1.5 rounded-full z-0 bg-green-800"
              :class="{'bg-red-600 rounded-md': displayChordNotes.includes(stri[i])}">{{ stri[i] }}</div>
            <div class="h-[1px] bg-neutral-500" :class="{'bg-neutral-900' : i === 0}"></div>
          </div>
        </div>
      </div>
        </div>
    </div>
    <div id="buttons" class="flex space-x-7 mt-4 shrink-0 overflow-x-auto">
        <div id="tuning-buttons" class="flex flex-col">
            <button @click="tuneGCEA" class="bg-blue-600 text-blue-200 w-20 py-4 rounded hover:bg-blue-700 ml-2" :class="{'bg-blue-800 text-white font-bold': tuning === 'GCEA'}">GCEA</button>
            <button @click="tuneDGBE" class="bg-blue-600 text-blue-200 w-20 py-4 rounded hover:bg-blue-700 ml-2" :class="{'bg-blue-800 text-white font-bold': tuning === 'DGBE'}">DGBE</button>
            <button @click="tuneADFsB" class="bg-blue-600 text-blue-200 w-20 py-4 rounded hover:bg-blue-700 ml-2" :class="{'bg-blue-800 text-white font-bold': tuning === 'ADFsB'}">ADF#B</button>
            <button @click="tuneFAsDG" class="bg-blue-600 text-blue-200 w-20 py-4 rounded hover:bg-blue-700 ml-2" :class="{'bg-blue-800 text-white font-bold': tuning === 'FAsDG'}">FA#DG</button>
        </div>
        <div class="flex flex-col">
            <div class="flex space-x-6">
                <div v-for="(tone, i) in NOTES" :key="i">
                    <button @click="setTone(tone)" :class="['bg-blue-600 w-14 h-14 font-bold items-center rounded hover:bg-blue-700 ml-2', selectedChord === normalizeToSharp(tone) ? 'bg-green-200 text-black font-bold' : 'text-blue-200']">{{ tone }} </button>
                </div>
            </div>
            <div class="flex space-x-6 justify-center">
                <div v-for="(subtone, j) in SUBNOTES" :key="j">
                    <button @click="setChord(subtone)" :class="['bg-blue-600 w-14 h-14 my-6 font-normal items-center rounded hover:bg-blue-700 ml-2', selectedSubChord === subtone ? 'bg-green-200 text-black font-bold' : 'text-blue-200']">{{ subtone }}</button>
                </div>
            </div>
        </div>
        </div>
    <div class="flex space-x-6 h-6">
        <p v-for="note in displayChordNotes" class="text-white font-bold">{{ note }}</p>
    </div>
    <button @click="toggleMode" class="bg-blue-600 ml-2 p-4 rounded-sm hover:bg-blue-500">#/b</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue'
import { CHORD_LIBRARY } from '../chordLibrary.js'

let NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const NOTES_PER_OCTAVE = NOTES.length;
const STRING_NOTES = ["A", "E", "C", "G"]
const SUBNOTES = ["Major", "Minor", "7", "maj7", "m7", "dim", "aug"]
const FLATS = ["Db", "Eb", "Gb", "Ab", "Bb"]
const SHARPS = ["C#", "D#", "F#", "G#","A#"]
let accidentalMode = ref("flat")
toggleAccidentals(NOTES, accidentalMode.value === "flat" ? "flat" : "sharp")

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
    console.log(selectedChord.value)

    return selectedChord
}

function setChord(d) {
    selectedSubChord.value = d
    console.log(selectedChord.value)

    return selectedChord, selectedSubChord
}

const chordNotes = computed(() => {
  if (!selectedChord.value || !selectedSubChord.value) return [];

  return (
    CHORD_LIBRARY[selectedChord.value][selectedSubChord.value] || []
  );
});

const displayChordNotes = computed(() => {
  return toggleAccidentals(chordNotes.value, accidentalMode.value === "flat" ? "flat" : "sharp");
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

    if (accidentalMode.value === "sharp") {
        accidentalMode.value = "flat"
    }
    else {
        accidentalMode.value = "sharp"
    }

  NOTES = toggleAccidentals(NOTES, accidentalMode.value)

  STRINGS.value = [
    toggleAccidentals(A_STRING.value, accidentalMode.value),
    toggleAccidentals(E_STRING.value, accidentalMode.value),
    toggleAccidentals(C_STRING.value, accidentalMode.value),
    toggleAccidentals(G_STRING.value, accidentalMode.value),
  ];
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
</script>

<style scoped>

button {
  line-height: 0.8;
}

</style>
