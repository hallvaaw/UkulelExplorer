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
              :class="{'bg-red-600 rounded-md': chordNotes.includes(stri[i])}">{{ stri[i] }}</div>
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
        <div v-for="(tone, i) in NOTES" :key="i" class="flex">
                <div :id="tone" class="bg-blue-600 text-blue-200 font-bold p-1 rounded" :class="{'bg-blue-800 text-white': selectedChord === tone}">{{ tone }}
            <div v-for="(subtone, j) in SUBNOTES" :key="j" class="flex flex-row">
                <button @click="setChord(tone, subtone)" :class="['bg-blue-600 w-14 py-1 font-normal rounded hover:bg-blue-700 ml-2', selectedChord === tone && selectedSubChord === subtone ? 'bg-green-200 text-black font-bold' : 'text-blue-200']">{{ subtone }}</button>
                </div>
            </div>
        </div>
    </div>
    <div class="flex space-x-6 h-6">
        <p v-for="note in chordNotes" class="text-white font-bold">{{ note }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue'
import { CHORD_LIBRARY } from '../chordLibrary.js'

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTES_PER_OCTAVE = NOTES.length;
const STRING_NOTES = ["A", "E", "C", "G"];
const SUBNOTES = ["Major", "Minor", "7", "maj7", "m7", "dim", "aug"];

const windowWidth = ref(window.innerWidth)

let selectedChord = ref()
let selectedSubChord = ref()
// const chordPositions = computed(() => CHORD_LIBRARY[selectedChord.value])
const showChord = ref(true)
const stringNames = ['A_STRING', 'E_STRING', 'C_STRING', 'G_STRING'];

const NUM_FRETS = [...Array(13).keys()]

function setChord(c, d) {
    selectedChord.value = c
    selectedSubChord.value = d
    return selectedChord, selectedSubChord
}

const chordNotes = computed(() => {
  if (!selectedChord.value || !selectedSubChord.value) return [];

  return (
    CHORD_LIBRARY[selectedChord.value][selectedSubChord.value] || []
  );
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

const mainTunings = {
    GCEA: { A: 9, E: 4, C: 0, G: 7 },
    ADFsB: { A: 11,  E: 6, C: 2, G: 9 },
    DGBE: { A: 4,  E: 11, C: 7, G: 2 },
    FAsDG: { A: 7,  E: 2, C: 10, G: 5 },
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
  console.log(tuningOffsets.value[name])
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
