const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_TO_SHARP = {
    Db: 'C#',
    Eb: 'D#',
    Gb: 'F#',
    Ab: 'G#',
    Bb: 'A#',
}

const QUALITY_ALIASES = {
    '': '',
    maj: '',
    major: '',
    m: 'm',
    min: 'm',
    minor: 'm',
    '7': '7',
    dom7: '7',
    maj7: 'maj7',
    m7: 'm7',
    min7: 'm7',
    m6: 'm6',
    min6: 'm6',
    minor6: 'm6',
    m7b5: 'm7b5',
    'm7(b5)': 'm7b5',
    min7b5: 'm7b5',
    halfdim: 'm7b5',
    'ø': 'm7b5',
}

const OPEN_CHORDS = {
    C: { label: 'Forma aberta', frets: [-1, 3, 2, 0, 1, 0] },
    D: { label: 'Forma aberta', frets: [-1, -1, 0, 2, 3, 2] },
    E: { label: 'Forma aberta', frets: [0, 2, 2, 1, 0, 0] },
    G: { label: 'Forma aberta', frets: [3, 2, 0, 0, 0, 3] },
    A: { label: 'Forma aberta', frets: [-1, 0, 2, 2, 2, 0] },

    Am: { label: 'Forma aberta', frets: [-1, 0, 2, 2, 1, 0] },
    Em: { label: 'Forma aberta', frets: [0, 2, 2, 0, 0, 0] },
    Dm: { label: 'Forma aberta', frets: [-1, -1, 0, 2, 3, 1] },

    C7: { label: 'Forma aberta', frets: [-1, 3, 2, 3, 1, 0] },
    D7: { label: 'Forma aberta', frets: [-1, -1, 0, 2, 1, 2] },
    E7: { label: 'Forma aberta', frets: [0, 2, 0, 1, 0, 0] },
    G7: { label: 'Forma aberta', frets: [3, 2, 0, 0, 0, 1] },
    A7: { label: 'Forma aberta', frets: [-1, 0, 2, 0, 2, 0] },
    B7: { label: 'Forma aberta', frets: [-1, 2, 1, 2, 0, 2] },

    Cmaj7: { label: 'Forma aberta', frets: [-1, 3, 2, 0, 0, 0] },
    Amaj7: { label: 'Forma aberta', frets: [-1, 0, 2, 1, 2, 0] },

    Am7: { label: 'Forma aberta', frets: [-1, 0, 2, 0, 1, 0] },
    Dm7: { label: 'Forma aberta', frets: [-1, -1, 0, 2, 1, 1] },
    Em7: { label: 'Forma aberta', frets: [0, 2, 0, 0, 0, 0] },
    Dm7b5: { label: 'Forma aberta', frets: [-1, -1, 0, 1, 1, 1] },
}

const BARRE_TEMPLATES = {
    '': {
        eShape: [0, 2, 2, 1, 0, 0],
        aShape: [-1, 0, 2, 2, 2, 0],
    },
    m: {
        eShape: [0, 2, 2, 0, 0, 0],
        aShape: [-1, 0, 2, 2, 1, 0],
    },
    '7': {
        eShape: [0, 2, 0, 1, 0, 0],
        aShape: [-1, 0, 2, 0, 2, 0],
    },
    maj7: {
        eShape: [0, 2, 1, 1, 0, 0],
        aShape: [-1, 0, 2, 1, 2, 0],
    },
    m7: {
        eShape: [0, 2, 0, 0, 0, 0],
        aShape: [-1, 0, 2, 0, 1, 0],
    },
    m6: {
        aShape: [-1, 0, 2, 2, 1, 2],
    },
    m7b5: {
        aShape: [-1, 0, 1, 0, 1, -1],
    },
}

const CHORD_INTERVALS = {
    '': [0, 4, 7],
    m: [0, 3, 7],
    '7': [0, 4, 7, 10],
    maj7: [0, 4, 7, 11],
    m7: [0, 3, 7, 10],
    m6: [0, 3, 7, 9],
    m7b5: [0, 3, 6, 10],
}

const STRING_OPEN_SEMITONES_LOW_TO_HIGH = [4, 9, 2, 7, 11, 4]

function normalizeRoot(note) {
    if (!note) return null
    const normalized = note.charAt(0).toUpperCase() + (note.charAt(1) || '')
    return FLAT_TO_SHARP[normalized] || normalized
}

function qualityToLabel(quality) {
    if (quality === '') return 'Maior'
    if (quality === 'm') return 'Menor'
    if (quality === '7') return 'Dominante 7'
    if (quality === 'maj7') return 'Maior com setima'
    if (quality === 'm7') return 'Menor com setima'
    if (quality === 'm6') return 'Menor com sexta'
    if (quality === 'm7b5') return 'Meio diminuto (m7b5)'
    return quality
}

function parseQuality(rawQuality) {
    const compact = (rawQuality || '')
        .replace(/\s+/g, '')
        .replace(/[()]/g, '')
        .toLowerCase()
    return QUALITY_ALIASES[compact]
}

function noteToSemitone(note) {
    return NOTES_SHARP.indexOf(note)
}

function getFretForRoot(openSemitone, rootSemitone) {
    for (let fret = 0; fret <= 12; fret += 1) {
        if ((openSemitone + fret) % 12 === rootSemitone) {
            return fret
        }
    }
    return null
}

function applyTemplate(template, rootFret) {
    return template.map((value) => {
        if (value < 0) return -1
        return rootFret + value
    })
}

function shapeKey(shape) {
    return shape.frets.join('-')
}

function getChordTones(rootSemitone, quality) {
    const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS['']
    return new Set(intervals.map(interval => (rootSemitone + interval) % 12))
}

function shapeContainsAllIntervals(shapeFrets, rootSemitone, intervals) {
    const played = new Set()

    shapeFrets.forEach((fret, lowToHighStringIndex) => {
        if (fret === null || fret === undefined || fret < 0) return
        played.add(getNoteAt(lowToHighStringIndex, fret))
    })

    return intervals.every((interval) => played.has((rootSemitone + interval) % 12))
}

function getRequiredIntervalsByQuality(quality) {
    const byQuality = {
        '': [0, 4],
        m: [0, 3],
        '7': [0, 4, 10],
        maj7: [0, 4, 11],
        m7: [0, 3, 10],
        m6: [0, 3, 7, 9],
        m7b5: [0, 3, 6],
    }

    return byQuality[quality] || [0]
}

function getRequiredToneSet(rootSemitone, quality) {
    const requiredIntervals = getRequiredIntervalsByQuality(quality)
    return new Set(requiredIntervals.map(interval => (rootSemitone + interval) % 12))
}

function getNoteAt(lowToHighStringIndex, fret) {
    return (STRING_OPEN_SEMITONES_LOW_TO_HIGH[lowToHighStringIndex] + fret) % 12
}

function addShapeIfUnique(shapes, used, shape) {
    if (!shape) return
    const key = shapeKey(shape)
    if (used.has(key)) return
    used.add(key)
    shapes.push(shape)
}

function buildUpperVoicing(baseShape, id, name) {
    if (!baseShape) return null
    return {
        id,
        name,
        frets: [-1, -1, baseShape.frets[2], baseShape.frets[3], baseShape.frets[4], baseShape.frets[5]],
    }
}

function generateCagedMinor6Shapes(rootSemitone, usedShapeKeys) {
    const quality = 'm6'
    const chordTones = getChordTones(rootSemitone, quality)
    const requiredIntervals = getRequiredIntervalsByQuality(quality)
    const requiredTones = new Set(requiredIntervals.map(interval => (rootSemitone + interval) % 12))

    const groups = [
        { strings: [2, 3, 4, 5], label: 'D-G-B-E' },
        { strings: [1, 2, 3, 4], label: 'A-D-G-B' },
        { strings: [0, 1, 2, 3], label: 'E-A-D-G' },
    ]

    const ranked = []

    for (const group of groups) {
        const candidateFrets = group.strings.map((stringIndex) => {
            const values = []
            for (let fret = 0; fret <= 15; fret += 1) {
                if (chordTones.has(getNoteAt(stringIndex, fret))) {
                    values.push(fret)
                }
            }
            return values
        })

        const [aList, bList, cList, dList] = candidateFrets

        for (const fretA of aList) {
            for (const fretB of bList) {
                for (const fretC of cList) {
                    for (const fretD of dList) {
                        const currentFrets = [fretA, fretB, fretC, fretD]
                        const minFret = Math.min(...currentFrets)
                        const maxFret = Math.max(...currentFrets)
                        const span = maxFret - minFret

                        if (span > 4) continue

                        const playedTones = new Set([
                            getNoteAt(group.strings[0], fretA),
                            getNoteAt(group.strings[1], fretB),
                            getNoteAt(group.strings[2], fretC),
                            getNoteAt(group.strings[3], fretD),
                        ])

                        if (!playedTones.has(rootSemitone)) continue
                        if (![...requiredTones].every((tone) => playedTones.has(tone))) continue

                        const frets = [-1, -1, -1, -1, -1, -1]
                        frets[group.strings[0]] = fretA
                        frets[group.strings[1]] = fretB
                        frets[group.strings[2]] = fretC
                        frets[group.strings[3]] = fretD

                        const shape = {
                            id: `caged-m6-${group.label}-${fretA}-${fretB}-${fretC}-${fretD}`,
                            name: `CAGED m6 (${group.label})`,
                            frets,
                        }

                        const key = shapeKey(shape)
                        if (usedShapeKeys.has(key)) continue

                        usedShapeKeys.add(key)
                        ranked.push({
                            shape,
                            score: (maxFret * 2) + span,
                        })
                    }
                }
            }
        }
    }

    return ranked
        .sort((left, right) => left.score - right.score)
        .slice(0, 6)
        .map((item) => item.shape)
}

function generateTriadShapes(rootSemitone, quality, usedShapeKeys) {
    const triadEligibleQualities = new Set(['', 'm', '7', 'maj7', 'm7'])
    if (!triadEligibleQualities.has(quality)) {
        return []
    }

    const chordTones = getChordTones(rootSemitone, quality)
    const requiredTones = getRequiredToneSet(rootSemitone, quality)
    const groups = [
        { strings: [3, 4, 5], label: 'G-B-E' },
        { strings: [2, 3, 4], label: 'D-G-B' },
        { strings: [1, 2, 3], label: 'A-D-G' },
    ]

    const variations = []

    for (const group of groups) {
        const [a, b, c] = group.strings
        const candidatesA = []
        const candidatesB = []
        const candidatesC = []

        for (let fret = 0; fret <= 12; fret += 1) {
            if (chordTones.has(getNoteAt(a, fret))) candidatesA.push(fret)
            if (chordTones.has(getNoteAt(b, fret))) candidatesB.push(fret)
            if (chordTones.has(getNoteAt(c, fret))) candidatesC.push(fret)
        }

        for (const fretA of candidatesA) {
            for (const fretB of candidatesB) {
                for (const fretC of candidatesC) {
                    const minFret = Math.min(fretA, fretB, fretC)
                    const maxFret = Math.max(fretA, fretB, fretC)

                    if (maxFret - minFret > 4) continue

                    const notes = [
                        getNoteAt(a, fretA),
                        getNoteAt(b, fretB),
                        getNoteAt(c, fretC),
                    ]

                    if (!notes.includes(rootSemitone)) continue
                    if (![...requiredTones].every((tone) => notes.includes(tone))) continue
                    if (new Set(notes).size < 2) continue

                    const frets = [-1, -1, -1, -1, -1, -1]
                    frets[a] = fretA
                    frets[b] = fretB
                    frets[c] = fretC

                    const shape = {
                        id: `triad-${group.label}-${fretA}-${fretB}-${fretC}`,
                        name: `Triade (${group.label})`,
                        frets,
                    }

                    const key = shapeKey(shape)
                    if (usedShapeKeys.has(key)) continue

                    usedShapeKeys.add(key)
                    variations.push({
                        shape,
                        score: (maxFret * 2) + (maxFret - minFret),
                    })
                }
            }
        }
    }

    return variations
        .sort((x, y) => x.score - y.score)
        .slice(0, 6)
        .map(item => item.shape)
}

export function parseChordInput(input) {
    const cleaned = (input || '').trim()
    if (!cleaned) {
        return { error: 'Digite uma cifra para buscar.' }
    }

    const match = cleaned.match(/^([A-Ga-g])([#b]?)(.*)$/)
    if (!match) {
        return { error: 'Formato invalido. Exemplo: C, Am, F#7, Bbmaj7, Dm7.' }
    }

    const rootRaw = `${match[1].toUpperCase()}${match[2] || ''}`
    const root = normalizeRoot(rootRaw)
    const quality = parseQuality(match[3])

    if (!root || noteToSemitone(root) === -1) {
        return { error: 'Tonica invalida. Use notas entre A e G, com # ou b opcional.' }
    }

    if (quality === undefined) {
        return { error: 'Qualidade nao suportada. Use: maior, m, 7, maj7, m7, m6 ou m7b5.' }
    }

    return {
        input: cleaned,
        root,
        quality,
        qualityLabel: qualityToLabel(quality),
        chordKey: `${root}${quality}`,
        displayName: `${root}${quality}`,
    }
}

export function getChordShapes(parsedChord) {
    if (!parsedChord || !parsedChord.root) return []

    const shapes = []
    const used = new Set()

    const open = OPEN_CHORDS[parsedChord.chordKey]
    if (open) {
        const openShape = {
            id: `${parsedChord.chordKey}-open`,
            name: open.label,
            frets: open.frets,
        }
        used.add(shapeKey(openShape))
        shapes.push(openShape)
    }

    const rootSemitone = noteToSemitone(parsedChord.root)
    const templateSet = BARRE_TEMPLATES[parsedChord.quality]
    const lowEOpen = noteToSemitone('E')
    const aOpen = noteToSemitone('A')
    let eShape = null
    let aShape = null

    if (templateSet) {
        const rootOnLowE = getFretForRoot(lowEOpen, rootSemitone)
        if (rootOnLowE !== null && Array.isArray(templateSet.eShape)) {
            const eShapeFrets = applyTemplate(templateSet.eShape, rootOnLowE)
            eShape = {
                id: `${parsedChord.chordKey}-e-shape`,
                name: 'Pestana (forma de E)',
                frets: eShapeFrets,
                barres: [{
                    fret: rootOnLowE,
                    fromString: 5,
                    toString: 0,
                    type: 'full',
                }],
            }
            addShapeIfUnique(shapes, used, eShape)
        }

        const rootOnA = getFretForRoot(aOpen, rootSemitone)
        if (rootOnA !== null && Array.isArray(templateSet.aShape)) {
            const aShapeFrets = applyTemplate(templateSet.aShape, rootOnA)
            aShape = {
                id: `${parsedChord.chordKey}-a-shape`,
                name: parsedChord.quality === 'm6'
                    ? 'Pestana (forma de Am6)'
                    : parsedChord.quality === 'm7b5'
                        ? 'Pestana (forma de Am7b5)'
                        : 'Pestana (forma de A)',
                frets: aShapeFrets,
                barres: parsedChord.quality === 'm7b5'
                    ? []
                    : [{
                        fret: rootOnA,
                        fromString: 4,
                        toString: 0,
                        type: 'partial',
                    }],
            }
            addShapeIfUnique(shapes, used, aShape)
        }
    }

    if (parsedChord.quality === 'm6' || parsedChord.quality === 'm7b5') {
        if (parsedChord.quality === 'm6') {
            const m6Formula = [0, 3, 7, 9]
            const cagedMinor6Shapes = generateCagedMinor6Shapes(rootSemitone, used)
            shapes.push(...cagedMinor6Shapes)
            return shapes.filter((shape) => shapeContainsAllIntervals(shape.frets, rootSemitone, m6Formula))
        }

        addShapeIfUnique(
            shapes,
            used,
            buildUpperVoicing(aShape, `${parsedChord.chordKey}-upper-a`, 'Voicing agudo (4 cordas)')
        )

        addShapeIfUnique(
            shapes,
            used,
            buildUpperVoicing(eShape, `${parsedChord.chordKey}-upper-e`, 'Voicing agudo alternativo')
        )

        return shapes
    }

    const triadVariations = generateTriadShapes(rootSemitone, parsedChord.quality, used)
    shapes.push(...triadVariations)

    return shapes
}
