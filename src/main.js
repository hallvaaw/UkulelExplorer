import { CHORD_LIBRARY } from './chordLibrary.js'
const { invoke } = window.__TAURI__.core

const NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]
const TOGGLED_NOTES = ["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"]
const FLATS = ["D♭","E♭","G♭","A♭","B♭"]
const SHARPS = ["C#","D#","F#","G#","A#"]
const SUBNOTES = ["Major", "Minor", "7", "maj7", "m7", "dim", "aug"]
const NUM_FRETS = Array.from({ length:13 }, (_,i) => i)
const stringNames = ['A_STRING', 'E_STRING', 'C_STRING', 'G_STRING']
const stringKeys = ['A', 'E', 'C', 'G']

let accidentalMode = "sharp"
let renderFlats = false
let tuning = "GCEA"

let selectedChord = null
let selectedSubChord = null

let A_STRING=[], E_STRING=[], C_STRING=[], G_STRING=[]

function convertNote(note, mode){
  if (mode === "flat" && note.includes("#")){
    const index = SHARPS.indexOf(note)
    return index !== -1 ? FLATS[index] : note
  }
  if (mode === "sharp" && FLATS.includes(note)){
    const index = FLATS.indexOf(note)
    return index !== -1 ? SHARPS[index] : note
  }
  return note
}

function toggleAccidentals(input, mode){
  if (typeof input==="string") return convertNote(input, mode)
  if (Array.isArray(input)) return input.map(n => convertNote(n, mode))
  return input
}

function normalizeToSharp(note){
  const index = FLATS.indexOf(note)
  return index !== -1 ? SHARPS[index] : note
}

function setTone(c) {
  selectedChord = normalizeToSharp(c)
  renderStrings()
  displaySelectedNotes()
  return selectedChord
}

function setChord(d) {
  selectedSubChord = d
  renderStrings()
  displaySelectedNotes()

  return selectedChord, selectedSubChord
}

function chordNotes(){
  if (!selectedChord || !selectedSubChord) return []
  return CHORD_LIBRARY[selectedChord]?.[selectedSubChord] || []
}

let tuningValue = null

function getAllChordPositions() {
  const notes = chordNotes()
  const positions = []

  STRINGS.forEach((string, stringIndex) => {
    string.forEach((note, fretIndex) => {
      if (notes.includes(note)) {
        positions.push({ stringIndex, fretIndex })
      }
    })
  })

  return positions
}

function getDisplayChordNotes() {
  return toggleAccidentals(
    chordNotes(),
    accidentalMode === "flat" ? "flat" : "sharp"
  )
}

const chordNotesEl = document.getElementById("chord-notes")
function displaySelectedNotes() {
  const displayChordNotes = getDisplayChordNotes()

  chordNotesEl.innerHTML = ''

  for (const chordNote of displayChordNotes) {
    const noteP = document.createElement('p')
    noteP.textContent = chordNote
    chordNotesEl.appendChild(noteP)
  }
}

function getDisplayToggledTones() {
  return renderFlats ? TOGGLED_NOTES : NOTES
}

function noteAt(index){ return NOTES[(index + NOTES.length) % NOTES.length] }

function stringNotes(frets, startIndex){
  let notes = []
  for (let i = startIndex; i < startIndex+frets; i++) notes.push(noteAt(i))
  return notes
}

let tuningOffsets = {
  A: 0,
  E: 0,
  C: 0,
  G: 0
}

let tuningValues = {
  A: 0,
  E: 0,
  C: 0,
  G: 0
}

let STRINGS = [
  A_STRING,
  E_STRING,
  C_STRING,
  G_STRING
]

function tuneStart(){
  A_STRING = stringNotes(13, 9)
  E_STRING = stringNotes(13, 4)
  C_STRING = stringNotes(13, 0)
  G_STRING = stringNotes(13, 7)
  STRINGS = [A_STRING, E_STRING, C_STRING, G_STRING]

  tuning = "GCEA"
}

tuneStart()

function getBaseTunings() {
  return {
    A: NOTES.indexOf(A_STRING[0]),
    E: NOTES.indexOf(E_STRING[0]),
    C: NOTES.indexOf(C_STRING[0]),
    G: NOTES.indexOf(G_STRING[0])
  }
}

const baseTunings = getBaseTunings()

function toggleMode() {
  accidentalMode = accidentalMode === "sharp" ? "flat" : "sharp"
  renderFlats = !renderFlats
  displaySelectedNotes()
  render()
}

const mainTunings = {
  GCEA: { A: 9, E: 4, C: 0, G: 7 },
  ADFsB: { A: 11, E: 6, C: 2, G: 9 },
  DGBE: { A: 4, E: 11, C: 7, G: 2 },
  FAsDG: { A: 7, E: 2, C: 10, G: 5 }
}

function tuneFunction(tuningData) {
  for (const [key, value] of Object.entries(tuningData)) {
    const notes = stringNotes(13, value)

    switch (key) {
      case "A":
        A_STRING = notes
        break
      case "E":
        E_STRING = notes
        break
      case "C":
        C_STRING = notes
        break
      case "G":
        G_STRING = notes
        break
    }

    baseTunings[key] = value
    tuningOffsets[key] = 0
    tuningValues[key] = 0
  }

  STRINGS = [
    A_STRING,
    E_STRING,
    C_STRING,
    G_STRING
  ]

  renderStrings()
}

function tuneTo(tuningName) {
    const tuningData = mainTunings[tuningName]
    tuning = tuningName
    tuneFunction(tuningData)
}

tuneTo("GCEA")

const toggleModeEl = document.getElementById("toggle-mode")
const toggleButton = document.createElement('button')
toggleButton.textContent = "#/♭"
toggleButton.addEventListener("click", () => {
    toggleMode()
})
toggleModeEl.appendChild(toggleButton)

const toneButtons = document.getElementById("tone-buttons")
for (const tone of NOTES) {
  const toneButton = document.createElement('button')
  toneButton.textContent = tone
  toneButton.className = 'tone-button'
  toneButton.addEventListener("click", () => {
      setTone(tone)
  })
  toneButtons.appendChild(toneButton)
}

const subToneButtons = document.getElementById("subtone-buttons")
for (const subTone of SUBNOTES) {
  const subToneButton = document.createElement('button')
  subToneButton.textContent = subTone
  subToneButton.className = 'tone-button'
  subToneButton.addEventListener("click", () => {
      setChord(subTone)
  })
  subToneButtons.appendChild(subToneButton)
}

const tuningButtons = document.getElementById("tuning-buttons")

Object.keys(mainTunings).forEach(tuning => {
  const tuningButton = document.createElement('button')
  tuningButton.textContent = tuning
  tuningButton.addEventListener("click", () => {
      tuneTo(tuning)
  })
  tuningButtons.appendChild(tuningButton)
})

function tuneString(name, direction = "up", tuneSet) {
  tuningOffsets[name] += direction === "up" ? 1 : -1
  tuningValues[name] += direction === "up" ? 1 : -1
  if (Math.abs(tuningOffsets[name]) === 12) {
        tuningOffsets[name] = 0
  }

  const newStart = baseTunings[name] + tuningOffsets[name]

  switch (name) {
    case "A":
      A_STRING = stringNotes(13, newStart)
      break
    case "E":
      E_STRING = stringNotes(13, newStart)
      break
    case "C":
      C_STRING = stringNotes(13, newStart)
      break
    case "G":
      G_STRING = stringNotes(13, newStart)
      break
  }

  STRINGS = [
    A_STRING,
    E_STRING,
    C_STRING,
    G_STRING
  ]

  renderStrings()
}

const fretContainer = document.getElementById('fret-overview')
NUM_FRETS.forEach(fret => {
  const div = document.createElement('div')
  div.className = 'fret-numbers'
  if ([3,5,7,10].includes(fret)) div.classList.add('font-bold','text-white','text-xl')
  div.textContent = fret
  fretContainer.appendChild(div)
})

function getStrings() {
  return [
    A_STRING,
    E_STRING,
    C_STRING,
    G_STRING
  ]
}

function isChordAt(positions, stringIndex, fretIndex) {
  return positions.some(
    p => p.stringIndex === stringIndex && p.fretIndex === fretIndex
  )
}

function renderStrings() {
  const stringsContainer = document.getElementById('strings-container')
  stringsContainer.innerHTML = ''

  const strings = getStrings()
  const allChordPositions = getAllChordPositions()

  strings.forEach((notes, stringIndex) => {
    const key = stringKeys[stringIndex]
    const offset = tuningOffsets[key]
    const row = document.createElement('div')
    row.className='flex items-center'
  
    const p = document.createElement('p')
    p.className = 'w-2 mx-4 text-neutral-400 font-bold tune-offset'
    p.textContent = offset
  
    if (Math.abs(offset) > 0) {
      p.classList.add('text-white')
    }
  
    const downBtn = document.createElement('button')
    downBtn.textContent = '←'
    downBtn.className = 'string-tune'
  
    downBtn.addEventListener('click', () => {
      tuneString(stringKeys[stringIndex], 'down', tuning)
      renderStrings()
    })
  
    const upBtn = document.createElement('button')
    upBtn.textContent = '→'
    upBtn.className = 'string-tune'
  
    upBtn.addEventListener('click', () => {
      tuneString(stringKeys[stringIndex], 'up', tuning)
      renderStrings()
    })
  
    row.append(p, downBtn, upBtn)
  
    notes.forEach((note, fretIndex) => {
      const preLetter = document.createElement('div')
      const cell = document.createElement('div')
      const postLetter = document.createElement('div')

      const letter = document.createElement('div')
      letter.className = 'letter'
      cell.className='cell'

      letter.textContent = toggleAccidentals(note, accidentalMode)

      if (fretIndex === 0) {
        preLetter.className = 'fret-zero'
        postLetter.className ='fret-zero'
      } else {
        preLetter.className='preletter'
        postLetter.className='preletter'
      }

      const isChord = allChordPositions.some(
        p => p.stringIndex === stringIndex && p.fretIndex === fretIndex
      )

      if (isChord) {
        letter.className = 'letter-active'
      }


      cell.appendChild(preLetter)
      cell.appendChild(letter)
      cell.appendChild(postLetter)

      row.appendChild(cell)

    })
  
    stringsContainer.appendChild(row)
  })
}

function render() {
  const allChordPositions = getAllChordPositions()
  const displayToggledTones = getDisplayToggledTones()

  renderStrings()
}

render()
