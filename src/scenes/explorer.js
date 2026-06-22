// Escena: laboratorio de parámetros de audio.
// Cuadrícula 4×3 (12 celdas). Tooltip al pasar el ratón por cada celda.

const boost = (v, factor = 3) => Math.min(1, Math.pow(v * factor, 0.75));

const NOTE_NAMES = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

function noteName(hz) {
  if (!hz) return "—";
  const semitone = Math.round(12 * Math.log2(hz / 440));
  const note = ((semitone % 12) + 12) % 12;
  const octave = Math.floor(semitone / 12) + 4;
  return NOTE_NAMES[note] + octave;
}

// Ajusta texto en varias líneas para el tooltip
function wrapText(text, maxW, ctx, font) {
  ctx.font = font;
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const CELLS = [
  // ── fila 1 ──────────────────────────────────────────────────────────────
  {
    key: "loudness", label: "Loudness",
    color: "#c07c2b",
    tooltip: "Intensidad percibida por el oído humano. El oído no es lineal: los sonidos medios (voces, melodías) parecen más fuertes que graves o agudos a la misma energía. Se calcula como bass×0.2 + mid×0.5 + treble×0.3. Diferente del volumen físico (RMS).",
    draw(ctx, x, y, size, signal) {
      const loud = signal.bass * 0.2 + signal.mid * 0.5 + signal.treble * 0.3;
      const b = boost(loud, 3);
      // Anillos concéntricos que se expanden — evoca la propagación del sonido
      for (let i = 3; i >= 0; i--) {
        const r = size * (0.10 + i * 0.09) * (i === 0 ? 1 : b * (1 - i * 0.15));
        ctx.beginPath();
        ctx.arc(x, y, Math.max(3, r), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(192, 124, 43, ${0.08 + (3 - i) * 0.06 * b})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(192, 124, 43, ${0.3 + b * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    },
    value: (s) => {
      const l = s.bass * 0.2 + s.mid * 0.5 + s.treble * 0.3;
      return (l * 100).toFixed(0) + "%";
    },
  },
  {
    key: "bass", label: "Graves",
    color: "#e05a2b",
    tooltip: "Energía en frecuencias bajas (20–250 Hz): bajos eléctricos, bombo, contrabajo. El oído los percibe como vibración física más que como tono. Son los que se sienten en el pecho en un concierto.",
    draw(ctx, x, y, size, signal) {
      const b = boost(signal.bass, 4);
      const r = size * 0.35 * b;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(4, r), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224, 90, 43, ${0.1 + b * 0.8})`;
      ctx.fill();
      ctx.strokeStyle = "#e05a2b";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    value: (s) => (s.bass * 100).toFixed(0) + "%",
  },
  {
    key: "mid", label: "Medios",
    color: "#2b9e6e",
    tooltip: "Energía en frecuencias medias (250–4000 Hz): voces, guitarras, pianos, la mayoría de instrumentos melódicos. El oído humano es más sensible en esta zona — pequeñas diferencias de energía aquí se perciben mucho más que en graves o agudos.",
    draw(ctx, x, y, size, signal) {
      const half = Math.max(3, size * 0.32 * boost(signal.mid));
      ctx.beginPath();
      ctx.rect(x - half, y - half, half * 2, half * 2);
      ctx.strokeStyle = "#2b9e6e";
      ctx.lineWidth = 2;
      ctx.stroke();
      const ref = size * 0.32;
      ctx.beginPath();
      ctx.rect(x - ref, y - ref, ref * 2, ref * 2);
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    value: (s) => (s.mid * 100).toFixed(0) + "%",
  },
  {
    key: "treble", label: "Agudos",
    color: "#4a7fd4",
    tooltip: "Energía en frecuencias altas (4000–20000 Hz): platillos, sibilancias de voces, brillos de sintetizador. Dan 'aire' y definición al sonido. A partir de 15–16 kHz muchos adultos dejan de oírlos.",
    draw(ctx, x, y, size, signal) {
      const base = Math.max(4, size * 0.38 * boost(signal.treble));
      ctx.beginPath();
      ctx.moveTo(x, y - base);
      ctx.lineTo(x + base * 0.866, y + base * 0.5);
      ctx.lineTo(x - base * 0.866, y + base * 0.5);
      ctx.closePath();
      ctx.strokeStyle = "#4a7fd4";
      ctx.lineWidth = 2;
      ctx.stroke();
      const ref = size * 0.38;
      ctx.beginPath();
      ctx.moveTo(x, y - ref);
      ctx.lineTo(x + ref * 0.866, y + ref * 0.5);
      ctx.lineTo(x - ref * 0.866, y + ref * 0.5);
      ctx.closePath();
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    value: (s) => (s.treble * 100).toFixed(0) + "%",
  },

  // ── fila 2 ──────────────────────────────────────────────────────────────
  {
    key: "brightness", label: "Brillo",
    color: "#aaa",
    tooltip: "Centroide espectral: el 'centro de gravedad' de todas las frecuencias activas. Cerca de 0 = el grave domina (sonido oscuro, como un bombo solo). Cerca de 1 = el agudo domina (sonido brillante, como platillos). Determina el 'color' del timbre.",
    draw(ctx, x, y, size, signal) {
      const r = size * 0.32;
      const hue = signal.brightness * 260;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.7, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r * 0.7, y);
      ctx.closePath();
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      ctx.fill();
      ctx.strokeStyle = `hsl(${hue}, 70%, 40%)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    value: (s) => s.brightness < 0.33 ? "grave" : s.brightness < 0.66 ? "medio" : "agudo",
  },
  {
    key: "density", label: "Densidad",
    color: "#888",
    tooltip: "Cuántas frecuencias distintas están activas simultáneamente. Un instrumento solo (flauta, voz a capella) = baja densidad. Una orquesta o mezcla electrónica densa = alta densidad. No mide volumen, mide riqueza espectral.",
    draw(ctx, x, y, size, signal) {
      const cols = 6, rows = 6;
      const spacing = size * 0.12;
      const active = Math.round(boost(signal.density, 2) * cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = x - (cols - 1) * spacing / 2 + c * spacing;
          const py = y - (rows - 1) * spacing / 2 + r * spacing;
          const idx = r * cols + c;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = idx < active ? "#666" : "#e8e8e8";
          ctx.fill();
        }
      }
    },
    value: (s) => (s.density * 100).toFixed(0) + "%",
  },
  {
    key: "beat", label: "Beat",
    color: "#c94fd8",
    _flash: 0,
    tooltip: "Detección de golpe rítmico (bombo, percusión). Se activa cuando la energía de graves supera 1.2× su media reciente y han pasado más de 100ms desde el último beat. Corresponde al pulso rítmico que el pie sigue solo.",
    draw(ctx, x, y, size, signal) {
      if (signal.beat) this._flash = 1;
      this._flash *= 0.75;
      const f = this._flash;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.42 * f, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201, 79, 216, ${f * 0.25})`;
      ctx.fill();
      const r = size * 0.2 + f * size * 0.18;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(6, r), 0, Math.PI * 2);
      ctx.fillStyle = `hsl(290, 70%, ${75 - f * 30}%)`;
      ctx.fill();
      ctx.strokeStyle = `hsl(290, 80%, ${40 + f * 20}%)`;
      ctx.lineWidth = 2 + f * 4;
      ctx.stroke();
    },
    value: (s) => s.beat ? "¡golpe!" : "—",
  },
  {
    key: "wavelength", label: "Longitud de onda (λ)",
    color: "#e08c2b",
    tooltip: "λ = velocidad_sonido / frecuencia = 343 / pitch (metros). El sonido viaja a 343 m/s en el aire a temperatura ambiente. Una nota grave (100 Hz) tiene λ = 3.4 m; una aguda (3400 Hz) tiene λ = 0.1 m. Los ciclos visibles representan cuántos λ caben en pantalla.",
    draw(ctx, x, y, size, signal) {
      const pitch = signal.pitch || 0;
      const cycles = pitch > 0 ? Math.max(0.3, pitch / 100) : 1;
      const W2 = size * 0.82;
      const ampH = size * 0.18;
      ctx.strokeStyle = "#eee";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const px = x - W2 / 2 + (i / 80) * W2;
        const py = y + Math.sin((i / 80) * Math.PI * 2) * ampH;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.strokeStyle = "#e08c2b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const px = x - W2 / 2 + (i / 120) * W2;
        const py = y + Math.sin((i / 120) * cycles * Math.PI * 2) * ampH;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.font = `500 ${size * 0.12}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "#e08c2b";
      ctx.fillText(pitch > 0 ? cycles.toFixed(1) + " ciclos" : "—", x, y - ampH - 6);
    },
    value: (s) => s.pitch > 0 ? (343 / s.pitch).toFixed(2) + " m" : "— m",
  },

  // ── fila 3 ──────────────────────────────────────────────────────────────
  {
    key: "amplitude", label: "Amplitud / Volumen",
    color: "#2b6ee0",
    tooltip: "Amplitud RMS: raíz cuadrática media de la señal de audio. Mide la energía física real de la onda, de forma objetiva. En este proyecto coincide con lo que llamamos 'volumen'. Es lo mismo medido con distintos nombres: amplitud es la medida física, volumen es la percepción humana de esa medida.",
    draw(ctx, x, y, size, signal) {
      const vol = boost(signal.volume);
      const ampH = size * 0.36 * vol;
      const cycles = 2;
      const W2 = size * 0.82;
      ctx.strokeStyle = "#eee";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - W2 / 2, y);
      ctx.lineTo(x + W2 / 2, y);
      ctx.stroke();
      const maxH = size * 0.36;
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - W2 / 2, y - maxH);
      ctx.lineTo(x + W2 / 2, y - maxH);
      ctx.moveTo(x - W2 / 2, y + maxH);
      ctx.lineTo(x + W2 / 2, y + maxH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "#2b6ee0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const px = x - W2 / 2 + (i / 120) * W2;
        const py = y + Math.sin((i / 120) * cycles * Math.PI * 2) * ampH;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    },
    value: (s) => (s.volume * 100).toFixed(0) + "%",
  },
  {
    key: "pitch", label: "Nota",
    color: "#333",
    tooltip: "Nota musical dominante detectada por autocorrelación sobre la forma de onda cruda. La autocorrelación encuentra el período que más se repite en la señal — ese período es la frecuencia fundamental (la nota que suena). Solo funciona con señales con tono definido (voz, instrumentos melódicos); el ruido o la percusión devuelve '—'.",
    draw(ctx, x, y, size, signal) {
      const name = noteName(signal.pitch);
      ctx.font = `bold ${size * 0.28}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = signal.pitch ? "#222" : "#ccc";
      ctx.fillText(name, x, y - size * 0.06);
      if (signal.pitch) {
        const norm = Math.min(1, (Math.log2(signal.pitch) - Math.log2(60)) / (Math.log2(1200) - Math.log2(60)));
        const hue = norm * 260;
        ctx.font = `${size * 0.11}px system-ui`;
        ctx.fillStyle = `hsl(${hue}, 60%, 50%)`;
        ctx.fillText(signal.pitch.toFixed(0) + " Hz", x, y + size * 0.22);
      }
    },
    value: (s) => noteName(s.pitch),
  },
  {
    key: "freq_hz", label: "Frecuencia Hz",
    color: "#7b52c9",
    tooltip: "Frecuencia de la nota detectada en hercios (Hz). El oído humano percibe entre 20 Hz (grave profundo, casi vibración) y 20.000 Hz (agudo extremo). La voz hablada está entre 100–3000 Hz. La nota La de referencia (afinación estándar) es 440 Hz. La barra muestra la posición en el espectro audible en escala logarítmica.",
    draw(ctx, x, y, size, signal) {
      const pitch = signal.pitch;
      const W2 = size * 0.82;
      const barH = size * 0.07;
      const bx = x - W2 / 2;

      // Barra de fondo (20 Hz – 20000 Hz, escala log)
      ctx.fillStyle = "#eee";
      ctx.beginPath();
      ctx.roundRect(bx, y + size * 0.10, W2, barH, 3);
      ctx.fill();

      if (pitch > 0) {
        // Posición logarítmica en el espectro audible
        const norm = Math.min(1, Math.max(0,
          (Math.log2(pitch) - Math.log2(20)) / (Math.log2(20000) - Math.log2(20))
        ));
        const markerX = bx + norm * W2;

        // Relleno hasta la posición actual
        const hue = norm * 260;
        ctx.fillStyle = `hsl(${hue}, 70%, 58%)`;
        ctx.beginPath();
        ctx.roundRect(bx, y + size * 0.10, norm * W2, barH, 3);
        ctx.fill();

        // Marcador vertical
        ctx.strokeStyle = `hsl(${hue}, 80%, 40%)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(markerX, y + size * 0.06);
        ctx.lineTo(markerX, y + size * 0.22);
        ctx.stroke();

        // Número grande de Hz
        ctx.font = `bold ${size * 0.22}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `hsl(${hue}, 70%, 40%)`;
        ctx.fillText(pitch < 1000
          ? pitch.toFixed(0) + " Hz"
          : (pitch / 1000).toFixed(2) + " kHz", x, y - size * 0.10);
      } else {
        ctx.font = `bold ${size * 0.22}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ccc";
        ctx.fillText("— Hz", x, y - size * 0.10);
      }

      // Etiquetas de referencia: 20Hz, 440Hz, 20kHz
      const refs = [{ hz: 20, label: "20" }, { hz: 440, label: "440" }, { hz: 20000, label: "20k" }];
      ctx.font = `${size * 0.09}px system-ui`;
      ctx.fillStyle = "#bbb";
      ctx.textBaseline = "top";
      for (const ref of refs) {
        const nx = Math.min(1, Math.max(0,
          (Math.log2(ref.hz) - Math.log2(20)) / (Math.log2(20000) - Math.log2(20))
        ));
        const rx = bx + nx * W2;
        ctx.textAlign = nx < 0.1 ? "left" : nx > 0.9 ? "right" : "center";
        ctx.fillText(ref.label, rx, y + size * 0.20);
      }
    },
    value: (s) => s.pitch > 0 ? s.pitch.toFixed(0) + " Hz" : "— Hz",
  },
  {
    key: "waveform", label: "Forma de onda",
    color: "#555",
    tooltip: "Forma de la señal de audio en el instante actual (dominio temporal). Muestra cómo varía la presión del aire en el tiempo — lo que 've' el micrófono. Una sinusoidal pura (tono simple) es una curva suave. Un acorde o ruido es una forma compleja e irregular.",
    draw(ctx, x, y, size, signal) {
      const wave = signal.wave;
      if (!wave || wave.length === 0) return;
      const W2 = size * 0.82;
      const ampH = size * 0.30;
      ctx.strokeStyle = "#eee";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - W2 / 2, y);
      ctx.lineTo(x + W2 / 2, y);
      ctx.stroke();
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i <= W2; i++) {
        const idx = Math.floor(i * wave.length / W2);
        const v = (wave[idx] - 128) / 128;
        const px = x - W2 / 2 + i;
        const py = y - v * ampH;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    },
    value: (s) => s.volume > 0.01 ? "señal activa" : "silencio",
  },
];

export const explorerScene = {
  name: "Explorador",

  setup(ctx) {
    this._mx = -1;
    this._my = -1;
    const c = ctx.canvas;
    c.addEventListener("mousemove", (e) => {
      const r = c.getBoundingClientRect();
      this._mx = (e.clientX - r.left) * (c.width / r.width);
      this._my = (e.clientY - r.top)  * (c.height / r.height);
    });
    c.addEventListener("mouseleave", () => { this._mx = -1; this._my = -1; });
  },

  draw(ctx, signal, t) {
    const { width: W, height: H } = ctx.canvas;

    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(0, 0, W, H);

    const COLS = 4;
    const ROWS = 3;
    const padX = W * 0.03;
    const padY = H * 0.06;
    const cellW = (W - padX * 2) / COLS;
    const cellH = (H - padY * 2) / ROWS;
    const cellSize = Math.min(cellW, cellH);

    // Guardar posiciones para el tooltip
    const positions = [];

    CELLS.forEach((cell, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx  = padX + col * cellW + cellW / 2;
      const cy  = padY + row * cellH + cellH / 2;
      const left = padX + col * cellW + 8;
      const top  = padY + row * cellH + 8;
      const cw   = cellW - 16;
      const ch   = cellH - 16;

      positions.push({ cell, cx, cy, left, top, cw, ch });

      // Fondo de celda
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(left, top, cw, ch, 12);
      ctx.fill();
      ctx.strokeStyle = "#ebebeb";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label arriba
      ctx.font = `500 ${cellSize * 0.08}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#aaa";
      ctx.fillText(cell.label.toUpperCase(), cx, top + 14);

      // Valor abajo
      ctx.font = `${cellSize * 0.08}px system-ui`;
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "#bbb";
      ctx.fillText(cell.value(signal), cx, top + ch - 10);

      // Forma visual central
      cell.draw(ctx, cx, cy, cellSize * 0.42, signal);
    });

    // Tooltip al hacer hover
    const hovered = positions.find(({ left, top, cw, ch }) =>
      this._mx >= left && this._mx <= left + cw &&
      this._my >= top  && this._my <= top  + ch
    );

    if (hovered) {
      const { cell, cx, top } = hovered;
      const TPADX  = 14;
      const TPADY  = 12;
      const TBOXW  = Math.min(320, W * 0.36);
      const TFONT  = `12px system-ui`;
      const TLINE  = 17;

      const lines = wrapText(cell.tooltip, TBOXW - TPADX * 2, ctx, TFONT);
      const TBOXH  = TPADY * 2 + 18 + lines.length * TLINE;

      let tx = cx - TBOXW / 2;
      let ty = top - TBOXH - 8;
      tx = Math.max(8, Math.min(W - TBOXW - 8, tx));
      ty = Math.max(8, Math.min(H - TBOXH - 8, ty));

      // Sombra suave
      ctx.shadowColor = "rgba(0,0,0,0.18)";
      ctx.shadowBlur  = 12;
      ctx.fillStyle   = "rgba(22,22,28,0.93)";
      ctx.beginPath();
      ctx.roundRect(tx, ty, TBOXW, TBOXH, 10);
      ctx.fill();
      ctx.shadowBlur  = 0;

      // Título
      ctx.font        = `600 13px system-ui`;
      ctx.textAlign   = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle   = "#ffffff";
      ctx.fillText(cell.label, tx + TPADX, ty + TPADY);

      // Cuerpo
      ctx.font      = TFONT;
      ctx.fillStyle = "#c8c8d0";
      lines.forEach((line, i) => {
        ctx.fillText(line, tx + TPADX, ty + TPADY + 18 + i * TLINE);
      });
    }
  },
};
