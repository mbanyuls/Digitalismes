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
    ├── main.js                 ← conecta las tres capas + ciclo de escenas
    ├── style.css
    ├── sources/
    │   └── audioFile.js        ← fuente: archivo de música
    ├── engine/
    │   ├── signal.js           ← el traductor (Prog. 1)
    │   └── renderer.js         ← el bucle de render (Prog. 2)
    ├── scenes/
    │   ├── line.js             ← osciloscopio (forma de onda cruda)
    │   ├── wave.js             ← onda en medio inhomogéneo
    │   ├── explorer.js         ← matriz de diagnóstico (12 parámetros + tooltips)
    │   ├── albufera.js         ← atardecer Albufera de Valencia
    │   ├── dones.js            ← les dones — bailarinas neón
    │   ├── ona.js              ← onda pura reactiva al pitch
    │   ├── ona2.js             ← onda anclada sin desplazamiento lateral
    │   ├── atardecer.js        ← fotografía con ondas de luz superpuestas
    │   ├── mar.js              ← fotografía con agua animada por desplazamiento real
    │   └── crestes.js          ← cordillera espectral tipo Joy Division
    ├── public/
    │   ├── atardecer.jpg       ← fotografía escena Atardecer
    │   └── mar.jpg             ← fotografía escena Mar
    └── ui/
        ├── controls.js         ← panel de parámetros (solo escena Onda)
        └── crestesControls.js  ← panel de parámetros (solo escena Crestes)
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

---

## Escenas implementadas

El ciclo de escenas se navega con el botón de la barra superior. El orden actual es:

**Onda → Explorador → Albufera → Les Dones → Ona → Ona 2 → Atardecer → Mar → Crestes → (vuelta al inicio)**

La navegación se hace con un **desplegable** en la barra superior. Al seleccionar el nombre de la escena en el menú, se cambia directamente.

**Sistema de paneles de control por escena:** el panel de parámetros (barra inferior) solo aparece en las escenas que lo necesitan. Actualmente hay dos paneles:
- **Panel Onda** — solo visible en "Onda en medio inhomogéneo": suavizado, amplitud, arcoíris, movimiento de color, grosor, color de picos.
- **Panel Crestes** — solo visible en "Crestes": velocitat, línies, alçada de pics, rang de freqüències.

---

### Escena 1 — Onda en medio inhomogéneo (`wave.js`)

La escena original del proyecto. Una línea que cruza la pantalla de lado a lado representando cómo viaja una onda en un medio cuyas propiedades cambian con la posición (ver sección de física al inicio del documento).

**Prompt original:** *"Queremos que la onda tenga más picos pero que siga siendo sinusoidal. Ver mejor reflejados los beats y los bajos, y empezar a dibujar la melodía."*

| Objeto visual | Parámetro | Comportamiento |
|---|---|---|
| Número de ciclos visibles | `bass` graves | más bajo = más ciclos en pantalla (onda más apretada) |
| Factor de compresión del medio | `treble` agudos | más agudos = medio más inhomogéneo = onda más comprimida a la derecha |
| Altura de la onda | `density` densidad espectral | mezcla densa = onda grande; instrumento solo = onda pequeña |
| Posición vertical | `pitch` nota dominante (Hz) | la melodía mueve la onda arriba y abajo en escala logarítmica |
| Color base | `pitch` semitono (0–11) | cada nota tiene su posición en la rueda HSL (30° por semitono) |
| Pulso de amplitud | `beat` golpe detectado | la onda crece de golpe y decae en ~15 frames |
| Grosor de línea | `volume` volumen | más fuerte = línea más gruesa |

---

### Escena 2 — Explorador (`explorer.js`)

Matriz de diagnóstico con 12 celdas en cuadrícula 4×3. Cada celda muestra un único parámetro del sonido con su nombre, valor numérico, una forma visual diferente y un **tooltip** (al pasar el ratón) que explica qué es ese parámetro y cómo lo percibe el oído humano.

**Prompt original:** *"Quiero que los parámetros del sonido se descompongan en objetos que pueda identificar. Quiero ver la longitud de onda y la amplitud también representadas."*

**Iteraciones posteriores:**
- *"¿Tiene sentido estar viendo amplitud y volumen como dos celdas separadas si son la misma variable?"* → debate sobre la diferencia entre amplitud física y percepción subjetiva
- *"Prefiero ver la amplitud. Pon en el título 'Amplitud/Volumen'. Lo del Loudness me parece chuli. ¿Podrías poner un tooltip en cada celda que explique qué es y cómo lo percibe el humano? Y me parece interesante ver también la frecuencia en hercios."*

**Sobre la relación Amplitud / Volumen:**
Son el mismo dato medido con dos nombres. `signal.volume` es la amplitud RMS (raíz cuadrática media) de la señal — una medida física y objetiva. "Volumen" es la percepción subjetiva de esa energía. En el proyecto se usan indistintamente porque apuntan al mismo número. El **Loudness** es diferente: pondera las bandas de frecuencia según cómo las percibe el oído (`bass×0.2 + mid×0.5 + treble×0.3`), porque los medios suenan más fuertes que los graves a igual energía.

| Celda | Parámetro | Forma visual | Tooltip |
|---|---|---|---|
| Loudness | `bass·0.2 + mid·0.5 + treble·0.3` | anillos concéntricos que se expanden | intensidad percibida por el oído, ponderada por sensibilidad auditiva |
| Graves | `bass` | círculo relleno que se expande | 20–250 Hz; vibración física, bombo, bajo |
| Medios | `mid` | cuadrado que crece | 250–4000 Hz; voces, melodías; zona de máxima sensibilidad del oído |
| Agudos | `treble` | triángulo que crece | 4000–20000 Hz; platillos, brillos, aire |
| Brillo | `brightness` centroide espectral | rombo que cambia de color | centro de gravedad del espectro; grave=oscuro, agudo=brillante |
| Densidad | `density` | cuadrícula de 6×6 puntos que se llenan | cuántas frecuencias están activas a la vez |
| Beat | `beat` | flash violeta que explota y decae | golpe detectado cuando graves supera 1.2× su media |
| Longitud de onda (λ) | `pitch` | onda sinusoidal con ciclos proporcionales a λ | λ = 343/pitch metros; los ciclos visibles representan cuántos λ caben en pantalla |
| Amplitud / Volumen | `volume` | onda sinusoidal cuya altura varía con la energía | amplitud RMS = medida física; volumen = percepción subjetiva de esa misma medida |
| Nota | `pitch` | nombre de nota (Do, Re#…) + Hz | nota detectada por autocorrelación sobre la forma de onda cruda |
| Frecuencia Hz | `pitch` | barra logarítmica 20 Hz–20 kHz con marcador | posición del sonido en el espectro audible; referencia: 440 Hz = La estándar |
| Forma de onda | `wave` | mini osciloscopio con señal cruda | forma de la señal en el tiempo; sinusoidal pura = curva suave; acorde/ruido = forma irregular |

---

### Escena 3 — Albufera (`albufera.js`)

Paisaje del atardecer en la Albufera de Valencia. Todos los objetos visuales son elementos naturales del entorno.

**Prompt de creación:** *"Vale viendo la matriz ahora lo que quiero es generar una nueva pantalla. El fondo va a ir cambiando de color con el volumen, quiero que se base en los colores de atardecer de la Albufera de Valencia. Cada vez que haya un beat quiero que aparezca un pato volando. La densidad va a aparecer abajo y va a ser una línea negra que vaya subiendo y bajando según la densidad. La longitud de onda va a ser un sol y la amplitud va a reaccionar cambiando los aros o los rayos del sol. Además con graves, medios y agudos quiero ver una onda en el centro de la pantalla que tenga tres picos."*

**Iteraciones posteriores:**
- *"Los graves medios y agudos van a dejar de ser ondas. Quiero que los graves sean una forma de árbol, los agudos una palmera y los medios una flor."*
- *"Las tres plantas del doble de su tamaño. Que la amplitud tenga color relleno hasta abajo en azul mar y que oscile con el brillo."*
- *"Los patos no quiero que orbiten alrededor del sol. Quiero que se distribuyan en la pantalla."*
- *"Los patos más grandes y con un tono dorado, como si el sol incidiera sobre ellos."*

| Objeto visual | Parámetro | Comportamiento |
|---|---|---|
| **Fondo** — degradado vertical (noche → naranja → dorado) | `volume` volumen | mayor volumen = cielo más brillante y cálido; silencio = noche oscura |
| **Agua** (franja inferior) | — | refleja los colores del cielo con transparencia |
| **Relleno azul mar** | `volume` amplitud | sube desde el fondo según el volumen; el borde ondulante cambia de frecuencia con el brillo |
| Frecuencia del borde del mar | `brightness` brillo espectral | sonido brillante = olas rápidas; sonido oscuro = ola lenta |
| **Sol** — tamaño | `pitch` longitud de onda | nota grave (λ larga) = sol grande; nota aguda (λ corta) = sol pequeño |
| **Rayos del sol** — longitud | `beat` golpe detectado | en cada beat los rayos estallan y se desvanecen suavemente |
| **Árboles** (izquierda, ×4) | `bass` graves | altura y anchura de la copa crecen con la energía de los graves |
| **Flores** (centro, ×3) | `mid` medios | tamaño de los pétalos y longitud del tallo crecen con los medios; rotan lentamente |
| **Palmeras** (derecha, ×2) | `treble` agudos | altura del tronco y longitud de frondes crecen con los agudos; se balancean con el sonido |
| **Línea de densidad** (negra, zona inferior) | `density` densidad espectral | sube cuando hay muchos instrumentos activos; baja en silencio o instrumento solo |
| **Patos** (×12, distribuidos por el cielo) | `volume` amplitud | velocidad de aleteo y tamaño del ala crecen con la amplitud; color dorado más brillante según la proximidad al sol |

**Detalle del color de los patos:** el tono ámbar de cada pato se calcula según su distancia horizontal al sol (posición 76% del ancho). Los más cercanos al sol reciben un tono dorado brillante y un destello en el lomo; los más lejanos son ámbar oscuro. Los patos siempre miran en la dirección de su vuelo (flip horizontal según dirección).

---

### Escena 4 — Les Dones (`dones.js`)

Misma composición que Albufera (fondo de atardecer, agua, sol, patos dorados, línea de densidad, relleno azul mar), pero las plantas son reemplazadas por tres bailarinas en colores neón que reaccionan cada una a una banda de frecuencia.

**Prompt de creación:** *"Quiero una nueva pantalla que sea la misma que Albufera, pero en lugar de tener plantas, quiero que graves sea una mujer, agudos sea otra mujer, y medios sea otra mujer. Quiero que bailen. No sé, moviendo los brazos, las piernas. Además, que cada una sea de un color y que sean colores flúor."*

**Iteraciones posteriores:**
- *"Que una tenga el pelo melenita, la otra pelo largo con flequillo, y la tercera pelo corto tipo Pixie."*
- *"La silueta de las mujeres fuese algo más lineal, más fino, más de pincel y que no tenga relleno, para que se note más el movimiento del cuerpo."*
- *"Las mujeres un poquito más realistas. La del pelo largo que no lo tenga tan largo, más a la altura de los hombros."*
- *"Los patos nunca vuelan hacia atrás."* (corrección aplicada también en Albufera)

| Objeto visual | Parámetro | Comportamiento |
|---|---|---|
| **Mujer izquierda** — magenta `#FF10F0` | `bass` graves | magnitud del movimiento (amplitud del baile, vuelo de falda) proporcional a los graves |
| **Mujer centro** — lima `#CCFF00` | `mid` medios | magnitud del movimiento proporcional a los medios |
| **Mujer derecha** — cian `#00F5FF` | `treble` agudos | magnitud del movimiento proporcional a los agudos; más rápida por naturaleza de los agudos |
| Movimiento de cada mujer | energía de su banda | brazos suben, piernas se separan, cuerpo rebota y se balancea con la música; a más energía, más amplitud y velocidad |
| Falda | energía de su banda | se abre con el movimiento (flare proporcional a la energía) |
| Halo neón | energía de su banda | brillo difuminado detrás de la figura, más intenso con más energía |
| Fondo, agua, sol, patos, densidad, mar azul | igual que Albufera | ídem |

**Anatomía de las figuras (estilo trazo de pincel, sin relleno):**
cuello, hombros curvos, escote en V, curva de busto, cinturón, falda con pliegues, brazos con codo marcado, piernas con rodilla, cabeza ovalada, ojos y boca.

**Peinados:**
- Izquierda (graves): **melenita bob** — contorno del corte hasta la mandíbula con 3 líneas de textura interior
- Centro (medios): **pelo largo con flequillo** — 4 mechones hasta el hombro que se mueven, más flequillo recto
- Derecha (agudos): **pixie corto** — casquete corto con 4 mechones en punta que se erizan con la energía de los agudos

---

### Escena 5 — Ona (`ona.js`)

Onda pura sobre fondo negro. Toda la pantalla es un único gesto visual: la onda y el color del aire que la rodea.

**Prompt de creación:** *"Vamos a crear una nueva pantalla con una nueva onda. Vamos a dejar un fondo que cambie de color según la longitud de onda y que cambie de transparencia según la amplitud. La onda se va a mover según graves, medios y agudos y va a cambiar de grosor según el volumen. Para el beat que aparezca un destello luminoso."*

| Objeto visual | Parámetro | Comportamiento |
|---|---|---|
| **Fondo** — tono de color | `pitch` longitud de onda | nota grave (λ larga) → tonos cálidos (rojo/naranja, hue 0°); nota aguda (λ corta) → tonos fríos (azul/violeta, hue 260°); transición suave con la melodía |
| **Fondo** — opacidad | `volume` amplitud | silencio = casi transparente (fondo negro); música fuerte = color vívido y denso |
| **Onda** — componente lento y grande | `bass` graves | ondulación de baja frecuencia (2.2 ciclos en pantalla) con amplitud hasta el 32% de la altura |
| **Onda** — componente medio | `mid` medios | ondulación media (7 ciclos) con amplitud hasta el 14% de la altura |
| **Onda** — componente rápido y fino | `treble` agudos | rizado rápido (22 ciclos) con amplitud hasta el 6% de la altura |
| **Onda** — grosor de línea | `volume` volumen | de 1.5px (silencio) a 13px (volumen máximo) |
| **Onda** — color | `pitch` (derivado del hue del fondo) | mismo tono que el fondo pero más claro y saturado; 3 capas superpuestas (halo difuso, halo interior, línea nítida) |
| **Destello de beat** | `beat` golpe detectado | gradiente radial blanco desde el centro que se expande y desvanece en ~15 frames; además la onda se vuelve blanca instantáneamente en el beat |

La onda suma las tres componentes en una sola curva. En un momento de baja densidad (instrumento solo), la curva es limpia y sinusoidal. Con batería + bajo + melodía, la curva tiene forma compleja con múltiples frecuencias visibles simultáneamente.

---

### Escena 6 — Ona 2 (`ona2.js`)

Variante directa de Ona que resuelve un problema de percepción visual: en Ona la onda viaja lateralmente de forma continua, lo que hace que el patrón se vea repetido y en movimiento constante hacia un lado. Ona 2 congela ese viaje manteniendo exactamente la misma forma sinuosa.

**Prompt de creación:** *"En Ona estoy viendo una onda muy sinuosa, unos picos muy sinuosos que se repiten en el tiempo y a lo que mi ojo ve son iguales conforme se van desplazando. Me gustaría coger ese trozo, justo ese bloque, y verlo en Ona 2, con esa longitud, pero sin que se desplace lateralmente."*

**La diferencia técnica entre Ona y Ona 2:**

En Ona, la fórmula de la onda incluye el tiempo como desfase:
```
y = bass · sin(x · frecuencia + t · velocidad)
```
El término `t · velocidad` hace que la curva se desplace un píxel a la derecha en cada frame — el ojo lo lee como un patrón viajando.

En Ona 2, ese término se elimina:
```
y = bass · sin(x · frecuencia)
```
La forma de la onda queda anclada en pantalla. Lo único que cambia son las amplitudes (bass, mid, treble), así que la onda **respira** con la música en lugar de viajar.

La onda se dibuja en el 60% central de la pantalla (de 20% a 80% del ancho). Fondo, grosor, color y destello de beat son idénticos a Ona.

| Objeto visual | Parámetro | Comportamiento |
|---|---|---|
| **Fondo** — tono | `pitch` | ídem Ona: grave = rojo/naranja, agudo = azul/violeta |
| **Fondo** — opacidad | `volume` amplitud | ídem Ona |
| **Onda** — altura de la ondulación grande | `bass` graves | crece y encoge en amplitud; la curva respira pero no se mueve |
| **Onda** — altura de la ondulación media | `mid` medios | ídem |
| **Onda** — altura del rizado fino | `treble` agudos | ídem |
| **Onda** — grosor | `volume` volumen | ídem Ona |
| **Destello de beat** | `beat` | ídem Ona |

---

### Escena 7 — Atardecer (`atardecer.js`)

Fotografía real de fondo con ondas de luz animadas superpuestas sobre la zona del mar. La foto tiene el mar detrás de rocas y un edificio en primer plano, por lo que no es posible aislar automáticamente los píxeles de agua — la solución actual (Opción A) superpone líneas luminosas sobre la región aproximada del mar.

**Prompt de creación:** *"Crearía una nueva pantalla con una imagen de un atardecer. ¿Cómo podemos hacer para que esta imagen se mueva? ¿Puedes mover las olas del mar al ritmo de la música?"*

**Opción A — activa:** ondas de luz semitransparentes dibujadas encima de la zona del mar (~40%–62% de la altura de la imagen). 6 líneas a distintas alturas, frecuencias y velocidades; paleta cálida (rosas/dorados) que recoge los tonos de la foto.

**Opción C — preparada en el código, pendiente de activar:** cuando se disponga de una máscara (imagen en blanco y negro donde blanco = agua, negro = resto, creada en Photoshop/Procreate), se puede activar definiendo `MASK_SRC = "/atardecer-mask.png"` en el archivo. El código ya está estructurado para soportarla.

| Objeto visual | Parámetro | Comportamiento |
|---|---|---|
| Líneas de luz sobre el mar | `bass` graves | amplitud (altura) de cada línea de ola |
| Opacidad de las líneas | `volume` volumen | más fuerte = líneas más visibles |
| Velocidad de viaje | `mid` medios | frecuencia y velocidad de las ondas individuales |
| Destello sobre el mar | `beat` golpe | flash cálido dorado sobre la región del agua |

---

### Escena 8 — Mar (`mar.js`)

Fotografía real con el agua animada mediante **desplazamiento de franjas** (*wave warp*): la imagen se divide en tiras horizontales de 3px y cada tira del agua se desplaza en dos dimensiones según una función de onda. El cielo queda completamente estático. El efecto visual es el del agua ondulando y moviéndose de forma convincente, similar al efecto "wave warp" de editores de vídeo.

**Prompt de creación:** *"No quiero que me dibujes ondas en la zona de agua. Mi objetivo es que las olas del mar se muevan al ritmo de la música. El movimiento del agua va en diagonal de izquierda a derecha."*

**Prompt de ajuste:** *"No quiero ver destellos con el beat, y me gustaría que se notase más el movimiento de las aguas. ¿Se mueven solo en horizontal? ¿No pueden ondear?"*

**Técnica — desplazamiento 2D de franjas:**
- La imagen se dibuja primero completa (sky estático)
- Luego el 50% inferior (agua) se redibuja franja a franja (3px cada una)
- Cada franja tiene dos desplazamientos independientes:
  - **Horizontal** (`offsetX`): cada franja se mueve a izquierda/derecha → las crestas viajan hacia abajo → el ojo lo lee como movimiento diagonal izq→der, igual que olas reales
  - **Vertical** (`offsetV`): se varía qué fila de la imagen fuente se lee → las filas se comprimen y estiran → el agua ondea arriba/abajo además de horizontalmente
- Las franjas del primer plano (orilla) tienen más amplitud que las del horizonte (mar abierto más calmado)
- La composición de tres frecuencias (como Ona) da movimiento orgánico y no repetitivo

| Objeto visual | Parámetro | Comportamiento |
|---|---|---|
| Amplitud horizontal de las olas | `bass` graves | ola principal grande, hasta 34px de desplazamiento |
| Frecuencia media del oleaje | `mid` medios | segunda capa de olas más frecuentes |
| Rizado fino del agua | `treble` agudos | textura de superficie, olas pequeñas y rápidas |
| Intensidad general | `volume` volumen | todas las amplitudes escalan con el volumen |
| Beat | — | sin efecto visual (eliminado por petición) |

**Opción C preparada:** igual que Atardecer, el código tiene la estructura para recibir una máscara (`MASK_SRC = "/mar-mask.png"`) que permitiría aplicar el desplazamiento solo a los píxeles exactos de agua, incluyendo reflexiones y zonas irregulares.

---

### Escena 9 — Crestes (`crestes.js`)

Visualización inspirada en la portada del álbum *Unknown Pleasures* de Joy Division (1979): líneas blancas apiladas sobre fondo negro que forman una cordillera animada en tiempo real con el espectro de frecuencias de la música.

**Referencia visual:** *"Nueva idea. Te paso una imagen de referencia. Tenemos un fondo negro y líneas blancas representando la música. Estas líneas blancas dan la sensación visual de que se mueven hacia adelante. Yo entiendo que con la frecuencia y luego se van generando diferentes picos en la horizontal mostrando graves, medios y agudos de izquierda a derecha."*

**Concepto técnico:**
- Cada línea horizontal es una **fotografía del espectro de frecuencias** (FFT) en un instante concreto del tiempo.
- El eje X representa frecuencia: **izquierda = graves (bass), centro = medios (mid), derecha = agudos (treble)**. La escala es logarítmica para dar más espacio visual a los graves, que es donde el oído percibe más detalle.
- La altura de cada pico en una línea = energía de esa frecuencia en ese instante.
- Se captura un nuevo frame del espectro y se añade a un buffer de historial. Cuando el buffer está lleno, el frame más antiguo se descarta.

**Iteración 1 — dirección del movimiento:**
*"Quiero que la primera señal se vea en la línea más alta de la pantalla. Quiero que salte la señal en la primera línea de arriba y que se vaya diluyendo poco a poco hacia abajo, como si desapareciera. Las líneas de la parte superior siempre van a tener los picos más fuertes, y luego se van a ir reduciendo hacia mí. Como si fuera un mar con el oleaje de fondo y yo estoy en la orilla."*

→ La línea **nueva** aparece siempre **arriba** (en el horizonte, al 50% de la pantalla), con los picos más altos. A medida que envejece, baja hacia la orilla (la parte inferior) y sus picos se achatan hasta casi desaparecer. El 50% superior de la pantalla queda completamente negro.

**Iteración 2 — layout y panel de control:**
*"La última no quiero que esté en lo alto de la pantalla; quiero que empiece al 50% de la pantalla. Quiero también que el cuadro de mando solo se vea en la primera pantalla. Para esta nueva pantalla quiero un nuevo cuadro de mando con los parámetros que me puedan ayudar a modificar esta nueva."*

→ Las líneas ocupan del 50% al 92% de la pantalla. Panel de control exclusivo para Crestes.

**Técnica de renderizado — painter's algorithm con máscara negra:**
1. Se dibuja cada línea de arriba hacia abajo (la nueva primero, la más vieja última).
2. Cada línea se dibuja dos veces: primero se **rellena de negro** el área bajo los picos (oculta las líneas anteriores que quedan detrás), luego se **traza en blanco** solo la silueta de los picos.
3. Esto crea el efecto de que cada línea "tapa" lo que tiene detrás, dando profundidad y la sensación de cordillera o mar.

**Perspectiva:**
- Las líneas de arriba (nuevas, horizonte) son ligeramente más estrechas y tienen picos grandes.
- Las de abajo (viejas, orilla) son más anchas pero con picos casi planos.
- La opacidad decrece de arriba (0.85) a abajo (0.15), reforzando el efecto de distancia.

**Panel de control Crestes** (`src/ui/crestesControls.js`):

| Parámetro | Rango | Efecto |
|---|---|---|
| **Velocitat** | 1–5 | Rapidez de desplazamiento (1=rápido, 5=lento). Controla cada cuántos frames se captura un nuevo espectro. |
| **Línies** | 20–90 | Cuántas líneas se ven simultáneamente en pantalla. |
| **Alçada pics** | 0.2–3.0 | Multiplicador de la altura de los picos. Más alto = montañas más dramáticas. |
| **Rang freq.** | 0.1–0.9 | Fracción del espectro FFT que se muestra. 0.1 = solo graves; 0.9 = graves + medios + agudos hasta ~16kHz. |

| Objeto visual | Parámetro de audio | Comportamiento |
|---|---|---|
| Altura de picos en zona izquierda | `bass` graves | picos altos a la izquierda cuando hay bajo/bombo |
| Altura de picos en zona central | `mid` medios | picos en el centro con voces y melodías |
| Altura de picos en zona derecha | `treble` agudos | picos a la derecha con platillos y brillos |
| Velocidad de desplazamiento total | depende de `Velocitat` | controlable desde el panel |
| Opacidad y altura | decrecen de arriba a abajo | efecto de oleaje que se desvanece en la orilla |

---

## Próximos pasos

1. **Fuente: micrófono** — `sources/microphone.js`, misma interfaz que `audioFile.js`.
2. **Fuente: MIDI** — `sources/midi.js`, usando Web MIDI API. Los knobs y la velocity mapean directamente al contrato de señal.
3. **Fuente: cámara** — `sources/camera.js`, analizando brillo y movimiento de vídeo.
4. **Refactor `signal.bands`** — exponer un array universal de N bandas (0–1) para que fuentes sin espectro (MIDI) puedan rellenarlo con notas y las escenas no cambien.
5. **Nuevas escenas** — la diseñadora trabaja solo con `draw(ctx, signal, t)` sobre el contrato existente.
