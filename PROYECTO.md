# Digitalismes — Documento de proyecto

## Qué es

Un sistema de visuales en tiempo real que reacciona a la música. La idea central es que el sonido —venga de donde venga— se convierte en imágenes que se mueven, deforman y colorean con él.

El equipo es dos programadoras y una diseñadora. La arquitectura está pensada para que cada perfil trabaje en su capa sin pisar a las demás.

---

## Concepto: propagación de onda en medio inhomogéneo

El visual central representa el sonido como una **onda que se propaga en un medio inhomogéneo** — un medio cuyas propiedades físicas cambian con la posición. Esta metáfora conecta directamente con cómo viaja el sonido en la realidad: a través del agua, la tierra o el aire estratificado, una onda nunca viaja igual en todos los puntos.

### La física

Cuando una onda periódica sinusoidal entra en un medio donde la velocidad de propagación disminuye progresivamente, ocurren tres cosas simultáneas:

**1. La longitud de onda se comprime**

La relación fundamental entre velocidad, frecuencia y longitud de onda es:

```
λ(x) = v(x) / f
```

Si la frecuencia `f` es constante pero la velocidad `v(x)` disminuye a medida que la onda avanza, la longitud de onda `λ` se acorta. La onda se "aprieta" visualmente.

**2. La amplitud crece**

Por conservación de energía (analogía con el efecto de una ola al acercarse a la orilla), la amplitud aumenta inversamente a la raíz de la velocidad:

```
A(x) ∝ 1 / √v(x)
```

Cuanto más lenta la onda, más alta. Esto produce el efecto de que la onda se estrecha y se eleva antes de romperse.

**3. La onda se desvanece**

El medio disipa energía de forma exponencial. Pasado el punto de máxima compresión, la onda se amortigua:

```
A(x) = A₀ · √(1 + k·x) · e^(−α·x)
```

El término `e^(−α·x)` hace que la onda crezca, llegue a un máximo y después desaparezca progresivamente.

### El modelo

La velocidad en cada punto sigue la ley:

```
v(x) = 1 / (1 + k·x)
```

Donde `k` es el **factor de inhomogeneidad**: controla cuánto se comprime el medio. Con `k` alto, la compresión es brusca y el máximo de amplitud aparece antes; con `k` bajo, la onda se extiende más antes de disiparse.

La fase acumulada se calcula con la integral analítica:

```
φ(x, t) = 2πf · (x + k·x²/2) − 2πf·t
```

Esto da la forma de la onda en cada punto del espacio y en cada instante del tiempo. La onda viaja de izquierda a derecha.

### El color como segunda dimensión física

El color de cada punto de la onda refleja su **longitud de onda local**. Igual que un prisma separa la luz blanca según su longitud de onda, aquí:

- Donde la onda es **larga** (izquierda, velocidad alta) → **rojo**
- Donde la onda se ha **comprimido** (derecha, velocidad baja) → **violeta**

El recorrido rojo → naranja → amarillo → verde → azul → violeta sigue el espectro visible. La física del sonido y la física de la luz se unen en el mismo visual.

### Conexión con la música

Cada parámetro del modelo físico está alimentado por una dimensión distinta del análisis de audio. El mapa actual es:

| Parámetro físico | Variable del sonido | Efecto visual |
|---|---|---|
| `f` frecuencia de la onda | `bass` graves | ciclos visibles en pantalla (1–3) |
| `k` factor de inhomogeneidad | `treble` agudos | cuánto se comprime el medio |
| `A₀` amplitud base | `density` densidad espectral | altura de la onda |
| `α` amortiguación | `volume` volumen | hasta dónde llega antes de desvanecerse |
| posición vertical del centro | `pitch` nota dominante (Hz) | la melodía mueve la onda arriba y abajo |
| color base | `pitch` nota cromática (0–11) | cada nota tiene un color fijo en la rueda |
| pulso de amplitud | `beat` golpe detectado | la onda crece de golpe y decae suavemente |
| grosor de línea | `volume` volumen | más fuerte = línea más gruesa |

### La melodía y el pitch

La nota dominante se detecta mediante **autocorrelación** sobre la forma de onda cruda (`signal.wave`). El algoritmo busca el período que más se repite en la señal — ese período corresponde a la frecuencia fundamental (la nota que suena).

El resultado es `signal.pitch` en Hz. A partir de ahí se calculan dos cosas:

**Posición vertical:** se convierte a escala logarítmica (como percibe el oído) y se mapea a un desplazamiento vertical. Nota grave = onda baja, nota aguda = onda alta. La melodía se dibuja como una trayectoria que sube y baja por la pantalla.

**Color de nota:** se convierte al número de semitono (0–11) dentro de la octava. Cada semitono tiene 30° en la rueda HSL (12 notas × 30° = 360°). El color transita suavemente entre notas buscando siempre el camino más corto en la rueda para evitar saltos bruscos.

### La densidad espectral

Mide cuántas bandas de frecuencia están activas simultáneamente. Se calcula contando los bins del espectro que superan un umbral mínimo y normalizando:

```
density = bins_activos / bins_totales   →   0–1
```

Un instrumento solo = `density` baja = onda pequeña y limpia.
Una mezcla densa con muchos instrumentos = `density` alta = onda grande.
Esto hace que la amplitud visual refleje la riqueza de la mezcla, no solo su volumen.

### Los beats

La detección de beat compara la energía de graves de cada frame con su media reciente. Cuando hay un pico significativo por encima de la media (factor 1.4×) y han pasado al menos 120ms desde el último beat, se activa `signal.beat = true`.

Visualmente, el beat dispara una envolvente de amplitud con **ataque instantáneo y decaimiento de ~15 frames**: la onda crece de golpe y vuelve a su estado normal suavemente. También satura momentáneamente el color.

---

## Definición del proyecto

### El visual

Un **osciloscopio**: una línea que recorre la pantalla de lado a lado y muestra la forma de onda del sonido en el momento presente. No es un historial — es el instante actual, como si pusieras un osciloscopio físico delante de los altavoces.

La onda ocupa toda la altura de la pantalla. Cuando el sonido es fuerte, la onda es grande; cuando es suave, se encoge. El sistema normaliza dinámicamente para que siempre use el espacio disponible.

### El color

El color es un arcoíris de prisma (rojo → naranja → amarillo → verde → azul → violeta) que cambia con la música en dos dimensiones:

- **El brillo del sonido** (centroide espectral) desplaza el arcoíris entero. Cuando mandan los graves, el color es cálido; cuando entran los agudos, se enfría hacia el violeta.
- **La amplitud local de cada punto** de la onda añade un segundo desplazamiento de color: los picos de la onda tienen un matiz distinto a los valles.

El color se construye con HSL porque el eje de matiz (0°–360°) *es* el espectro visible, igual que un prisma. No hay colores fijos: todo se calcula en vivo cada frame.

### Las entradas previstas

| Input | Estado |
|---|---|
| Archivo de música (MP3, WAV…) | ✅ implementado |
| Micrófono | pendiente |
| Cámara | pendiente |
| Dispositivos MIDI | pendiente |

---

## Teoría: cómo se descompone el sonido

La música no es "una cosa". Se mide en varias dimensiones independientes, y cada una puede mapearse a una propiedad visual distinta:

| Dimensión | Qué es | En el visual actual |
|---|---|---|
| **Amplitud / volumen** | Energía total de la señal (RMS) | Grosor de línea + saturación del color |
| **Frecuencia / espectro** | Distribución de graves, medios y agudos | Forma de la onda |
| **Brillo / timbre** (centroide espectral) | Si manda el grave o el agudo en ese instante | Desplazamiento del arcoíris |
| **Amplitud local** | La altura de cada punto concreto de la onda | Desplazamiento de color punto a punto |
| **Ritmo / beat** | Detección de golpes (picos de graves) | Pulso de amplitud + saturación de color |
| **Tono / melodía** | La nota dominante (autocorrelación) | Posición vertical + color de nota |
| **Densidad espectral** | Cuántas frecuencias están activas a la vez | Amplitud base de la onda |

### El centroide espectral

Es la medida más importante para el color. Se calcula como el "centro de gravedad" del espectro de frecuencias:

```
centroide = Σ(frecuencia × amplitud) / Σ(amplitud)
```

Da un número de 0 a 1. Cerca de 0 = el sonido es grave y oscuro (un bombo, un bajo). Cerca de 1 = el sonido es brillante y agudo (platillos, voces).

### La normalización dinámica

Para que la onda llene la pantalla independientemente del volumen de la canción, el sistema calcula el pico real de la señal en cada frame y escala la onda a ese pico. Una envolvente hace que el pico suba rápido pero baje lento, evitando que la onda colapse de golpe en los silencios.

---

## Arquitectura del código

### La idea central: el contrato de señal

Toda fuente de audio (archivo, micro, MIDI, cámara) entrega **un único objeto** al sistema visual:

```js
signal = {
  bass:       0–1,         // energía en graves
  mid:        0–1,         // energía en medios (sin usar visualmente aún)
  treble:     0–1,         // energía en agudos
  volume:     0–1,         // volumen global
  brightness: 0–1,         // centroide espectral (grave=0, agudo=1)
  density:    0–1,         // densidad espectral (solo=0, mezcla densa=1)
  beat:       bool,        // ¿hay golpe ahora?
  pitch:      Hz | 0,      // nota dominante en Hz, 0 si no hay tono claro
  wave:       Uint8Array,  // forma de onda cruda
  freq:       Uint8Array,  // espectro de frecuencias
}
```

Las escenas **solo leen este objeto**. No saben si el sonido viene de un MP3 o de un teclado MIDI. Añadir una fuente nueva no toca ninguna escena; crear una escena nueva no toca ninguna fuente.

### Las tres capas

```
Fuentes          Motor de señal       Capa visual
─────────────    ──────────────────   ─────────────────────
audioFile.js  →                   →  renderer.js
microphone.js →  signal.js        →  scenes/line.js
midi.js       →  (normaliza todo  →  scenes/...
camera.js     →   a 0–1)
```

**Fuentes** (`src/sources/`) — cada fuente crea un `AudioContext` y devuelve un `AnalyserNode`. El motor de señal no sabe qué tipo de fuente es.

**Motor de señal** (`src/engine/signal.js`) — recibe el `AnalyserNode` y cada frame calcula el objeto `signal`. Aquí viven el centroide espectral, la detección de beat y los suavizados.

**Motor de render** (`src/engine/renderer.js`) — ajusta el canvas al tamaño de pantalla (con soporte retina), corre el bucle `requestAnimationFrame` y llama a `scene.draw(ctx, signal, t)` cada frame.

**Escenas** (`src/scenes/`) — cada escena es un objeto con dos métodos:
```js
{
  setup(ctx) { ... },           // se llama una vez al cargar
  draw(ctx, signal, t) { ... }  // se llama cada frame
}
```
Trabajan solo con `ctx` (el canvas) y `signal`. La diseñadora puede crear escenas sin entender nada del sistema de audio.

**Controles** (`src/ui/controls.js`) — exporta un objeto `params` con los parámetros del visual. Los sliders del panel actualizan `params` en vivo y las escenas los leen directamente. Añadir un nuevo parámetro es una línea en el array `SLIDERS`.

### Estructura de archivos

```
Digitalismes/
├── index.html
├── package.json
└── src/
    ├── main.js                 ← conecta las tres capas
    ├── style.css
    ├── sources/
    │   └── audioFile.js        ← fuente: archivo de música
    ├── engine/
    │   ├── signal.js           ← el traductor (Prog. 1)
    │   └── renderer.js         ← el bucle de render (Prog. 2)
    ├── scenes/
    │   ├── line.js             ← osciloscopio (forma de onda cruda)
    │   └── wave.js             ← onda en medio inhomogéneo (visual principal)
    └── ui/
        └── controls.js         ← panel de parámetros en vivo
```

### Stack

- **Vanilla JS + Vite** — sin frameworks, sin dependencias de audio de terceros.
- **Web Audio API** — nativa del navegador. `AnalyserNode` para el espectro y la forma de onda.
- **Canvas 2D** — render actual. Preparado para migrar a WebGL/Three.js cuando haga falta.
- **HSL** — modelo de color elegido por ser el más natural para recorrer el espectro visible.

---

## Parámetros del panel de control

| Slider | Qué controla |
|---|---|
| Suavizado | Inercia temporal de la onda. Más alto = más líquida, menos nerviosa |
| Amplitud | Escala vertical de la onda dentro de la pantalla |
| Arcoíris | Cuántos grados de la rueda de color recorre el gradiente |
| Mov. color | Cuánto desplaza el brillo del sonido el arcoíris entero |
| Grosor | Grosor máximo de la línea (reacciona al volumen) |
| Color picos | Cuánto desplazan los picos de amplitud el color localmente |

---

## Próximos pasos

1. **Visualizar `mid`** — la energía en medios (voces, guitarras) es el único parámetro calculado sin efecto visual. Candidato natural: grosor de línea, dejando `volume` para la amortiguación.
2. **Refactor `signal.bands`** — exponer un array universal de N bandas (0–1) para que fuentes sin espectro (MIDI) puedan rellenarlo con notas y las escenas no cambien.
3. **Fuente: micrófono** — `sources/microphone.js`, misma interfaz que `audioFile.js`.
4. **Fuente: MIDI** — `sources/midi.js`, usando Web MIDI API. Los knobs y la velocity mapean directamente al contrato de señal.
5. **Fuente: cámara** — `sources/camera.js`, analizando brillo y movimiento de vídeo.
6. **Escenas nuevas** — la diseñadora trabaja solo con `draw(ctx, signal, t)` sobre el contrato existente.
