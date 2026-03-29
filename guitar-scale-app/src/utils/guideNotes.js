export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const MINOR_THIRD_CHORD_TYPES = new Set(['m7', 'm7b5'])

export function noteAt(root, semitones, chromatic = CHROMATIC_NOTES) {
    const rootIndex = chromatic.indexOf(root)
    if (rootIndex < 0) {
        return null
    }
    return chromatic[(rootIndex + semitones + 12) % 12]
}

export function getGuideSemitones(chordType) {
    const third = MINOR_THIRD_CHORD_TYPES.has(chordType) ? 3 : 4
    const seventh = chordType === 'maj7' ? 11 : 10
    return { third, seventh }
}

export function getGuideNotesForChord(root, chordType, chromatic = CHROMATIC_NOTES) {
    const { third, seventh } = getGuideSemitones(chordType)
    return {
        third: noteAt(root, third, chromatic),
        seventh: noteAt(root, seventh, chromatic),
    }
}
