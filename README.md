# Digitalismes

Visuales que reaccionan a la música, el micrófono, la cámara y dispositivos MIDI.

## Arquitectura (3 capas)

```
Fuentes  ->  Motor de señal  ->  Capa visual
(audio,      (normaliza a       (escenas que
 micro,       parámetros 0–1)    leen `signal`)
 cámara,
 MIDI)
```

La idea central: **toda fuente entrega un `AnalyserNode`**, el motor de señal lo
convierte en un objeto común `signal { bass, mid, treble, volume, beat, wave }`,
y las **escenas solo leen `signal`** — no saben de dónde viene el sonido.

## Estructura

- `src/sources/` — fuentes de entrada (de momento: `audioFile.js`)
- `src/engine/signal.js` — el "traductor" a parámetros 0–1
- `src/engine/renderer.js` — bucle de render y canvas
- `src/scenes/` — los visuales (cada uno con `setup` + `draw(ctx, signal)`)
- `src/main.js` — conecta las capas

## Reparto del equipo

- **Prog. 1** → `sources/` + `engine/signal.js`
- **Prog. 2** → `engine/renderer.js` + sistema de escenas
- **Diseñadora** → `scenes/` (solo trabaja con `draw(ctx, signal)`)

## Arrancar

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite, carga un MP3 y dale a Play.

## Crear una escena nueva

Copia `src/scenes/line.js`, cambia el `draw`, e impórtala en `main.js`.
Tienes disponible: `signal.bass`, `signal.mid`, `signal.treble`,
`signal.volume`, `signal.beat`, `signal.wave`.
