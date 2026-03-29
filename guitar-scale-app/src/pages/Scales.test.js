import { describe, expect, it } from 'vitest'
import {
    buildScaleFormats,
    buildScaleMarkers,
    NOTE_TO_SEMITONE,
} from './Scales.jsx'

function noteFromMarker(marker) {
    return marker?.value
}

describe('Scales logic', () => {
    const aHarmonicMinor = {
        root: 'A',
        pattern: {
            id: 'harmonicMinor',
            name: 'Menor Harmonica',
            intervals: [0, 2, 3, 5, 7, 8, 11],
        },
    }
    const dDorian = {
        root: 'D',
        pattern: {
            id: 'dorian',
            name: 'Dorico',
            intervals: [0, 2, 3, 5, 7, 9, 10],
        },
    }

    it('generates 5 CAGED formats for guitar known scales', () => {
        const markers = buildScaleMarkers(aHarmonicMinor, 'guitar', 1, 12)
        const formats = buildScaleFormats(markers, 'guitar', 1, 12, aHarmonicMinor)

        expect(formats).toHaveLength(5)
    })

    it('keeps C note in second format for A harmonic minor', () => {
        const markers = buildScaleMarkers(aHarmonicMinor, 'guitar', 1, 12)
        const formats = buildScaleFormats(markers, 'guitar', 1, 12, aHarmonicMinor)

        const second = formats[1]
        expect(second).toBeTruthy()

        const secondNotes = second.markerKeys
            .map((key) => noteFromMarker(markers[key]))
            .filter(Boolean)

        expect(secondNotes).toContain('C')
    })

    it('generates 7 formats for greek modes on guitar', () => {
        const markers = buildScaleMarkers(dDorian, 'guitar', 1, 12)
        const formats = buildScaleFormats(markers, 'guitar', 1, 12, dDorian)

        expect(formats).toHaveLength(7)
    })

    it('uses valid note semitone mapping for tonic in generated markers', () => {
        const markers = buildScaleMarkers(aHarmonicMinor, 'guitar', 1, 12)
        const tonicSemitone = NOTE_TO_SEMITONE[aHarmonicMinor.root]

        const tonicMarkers = Object.values(markers).filter((marker) => {
            const semitone = NOTE_TO_SEMITONE[marker.value]
            return semitone === tonicSemitone
        })

        expect(tonicMarkers.length).toBeGreaterThan(0)
    })
})
