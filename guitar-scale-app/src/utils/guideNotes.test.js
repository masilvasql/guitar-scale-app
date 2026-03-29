import { describe, expect, it } from 'vitest'
import { getGuideNotesForChord, getGuideSemitones } from './guideNotes'

describe('guide notes utils', () => {
    it('uses major third for maj7 chords', () => {
        const semitones = getGuideSemitones('maj7')
        const guideNotes = getGuideNotesForChord('C', 'maj7')

        expect(semitones.third).toBe(4)
        expect(guideNotes.third).toBe('E')
        expect(guideNotes.seventh).toBe('B')
    })

    it('uses minor third for m7 chords', () => {
        const semitones = getGuideSemitones('m7')
        const guideNotes = getGuideNotesForChord('C', 'm7')

        expect(semitones.third).toBe(3)
        expect(guideNotes.third).toBe('D#')
        expect(guideNotes.seventh).toBe('A#')
    })

    it('uses minor third for m7b5 chords', () => {
        const semitones = getGuideSemitones('m7b5')
        const guideNotes = getGuideNotesForChord('C', 'm7b5')

        expect(semitones.third).toBe(3)
        expect(guideNotes.third).toBe('D#')
        expect(guideNotes.seventh).toBe('A#')
    })

    it('keeps major third for dominant 7 chords', () => {
        const guideNotes = getGuideNotesForChord('C', '7')

        expect(guideNotes.third).toBe('E')
        expect(guideNotes.seventh).toBe('A#')
    })

    it('wraps notes correctly at end of chromatic scale', () => {
        const guideNotes = getGuideNotesForChord('B', 'maj7')

        expect(guideNotes.third).toBe('D#')
        expect(guideNotes.seventh).toBe('A#')
    })
})
