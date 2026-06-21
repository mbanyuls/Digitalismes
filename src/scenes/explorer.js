// Escena: laboratorio de parámetros de audio.
// Muestra cada dimensión del sonido como un objeto visual independiente.
// Herramienta de aprendizaje: permite entender cómo se comporta cada parámetro.

// Amplifica valores 0–1 para que reaccionen con todo el rango visual.
// La curva de potencia hace que valores bajos se vean más y las diferencias sean obvias.
const boost = (v, factor = 3) => Math.min(1, Math.pow(v * factor, 0.75));

const NOTE_NAMES = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

function noteName(hz) {
  if (!hz) return "—";
  const semitone = Math.round(12 * Math.log2(hz / 440));
  const note = ((semitone % 12) + 12) % 12;
  const octave = Math.floor(semitone / 12) + 4;
  return NOTE_NAMES[note] + octave;
}

// cada celda define cómo dibujarse
const CELLS = [
  {
    key: "volume", label: "Volumen", color: "#555",
    draw(ctx, x, y, size, signal) {
      const r = size * 0.35 * boost(signal.volume);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(4, r), 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, size * 0.35, 0, Math.PI * 2);
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    value: (s) => (s.volume * 100).toFixed(0) + "%",
  },
  {
    key: "bass", label: "Graves", color: "#e05a2b",
    draw(ctx, x, y, size, signal) {
      const b = boost(signal.bass, 4);
      const r = size * 0.35 * b;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(4, r), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224, 90, 43, ${0.1 + b * 0.8})`;
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    value: (s) => (s.bass * 100).toFixed(0) + "%",
  },
  {
    key: "mid", label: "Medios", color: "#2b9e6e",
    draw(ctx, x, y, size, signal) {
      const half = Math.max(3, size * 0.32 * boost(signal.mid));
      ctx.beginPath();
      ctx.rect(x - half, y - half, half * 2, half * 2);
      ctx.strokeStyle = this.color;
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
    key: "treble", label: "Agudos", color: "#4a7fd4",
    draw(ctx, x, y, size, signal) {
      const base = Math.max(4, size * 0.38 * boost(signal.treble));
      ctx.beginPath();
      ctx.moveTo(x, y - base);
      ctx.lineTo(x + base * 0.866, y + base * 0.5);
      ctx.lineTo(x - base * 0.866, y + base * 0.5);
      ctx.closePath();
      ctx.strokeStyle = this.color;
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
  {
    key: "brightness", label: "Brillo", color: "#aaa",
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
    key: "density", label: "Densidad", color: "#888",
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
    key: "beat", label: "Beat", color: "#c94fd8",
    _flash: 0,
    draw(ctx, x, y, size, signal) {
      if (signal.beat) this._flash = 1;
      this._flash *= 0.75;
      const f = this._flash;
      // fondo que explota en cada golpe
      ctx.beginPath();
      ctx.arc(x, y, size * 0.42 * f, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201, 79, 216, ${f * 0.25})`;
      ctx.fill();
      // círculo principal
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
    key: "wavelength", label: "Longitud de onda (λ)", color: "#e08c2b",
    draw(ctx, x, y, size, signal) {
      // λ = velocidad_sonido / frecuencia = 343 / pitch
      // ciclos visibles: escalamos para que 100Hz ≈ 1 ciclo, 800Hz ≈ 8 ciclos
      const pitch = signal.pitch || 0;
      const lambda = pitch > 0 ? (343 / pitch) : 0;
      const cycles = pitch > 0 ? Math.max(0.3, pitch / 100) : 1;
      const W2 = size * 0.82;
      const ampH = size * 0.18; // altura fija — solo cambia el nº de ciclos

      // onda de referencia tenue (1 ciclo)
      ctx.strokeStyle = "#eee";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const px = x - W2 / 2 + (i / 80) * W2;
        const py = y + Math.sin((i / 80) * Math.PI * 2) * ampH;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();

      // onda real con los ciclos del pitch
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const px = x - W2 / 2 + (i / 120) * W2;
        const py = y + Math.sin((i / 120) * cycles * Math.PI * 2) * ampH;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();

      // nº de ciclos encima de la onda
      ctx.font = `500 ${size * 0.12}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = this.color;
      ctx.fillText(pitch > 0 ? cycles.toFixed(1) + " ciclos" : "—", x, y - ampH - 6);
    },
    value: (s) => s.pitch > 0 ? (343 / s.pitch).toFixed(2) + " m" : "— m",
  },
  {
    key: "amplitude", label: "Amplitud", color: "#2b6ee0",
    draw(ctx, x, y, size, signal) {
      const vol = boost(signal.volume);
      const ampH = size * 0.36 * vol; // altura cambia con el volumen
      const cycles = 2;               // ciclos fijos — solo cambia la altura
      const W2 = size * 0.82;

      // línea central de referencia
      ctx.strokeStyle = "#eee";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - W2 / 2, y);
      ctx.lineTo(x + W2 / 2, y);
      ctx.stroke();

      // límite de amplitud máxima (referencia)
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

      // onda real con la amplitud del volumen
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const px = x - W2 / 2 + (i / 120) * W2;
        const py = y + Math.sin((i / 120) * cycles * Math.PI * 2) * ampH;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();

      // flechas indicando la amplitud
      if (ampH > 6) {
        ctx.strokeStyle = `rgba(43, 110, 224, 0.35)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + W2 / 2 + 8, y);
        ctx.lineTo(x + W2 / 2 + 8, y - ampH);
        ctx.stroke();
      }
    },
    value: (s) => (s.volume * 100).toFixed(0) + "%  vol",
  },
  {
    key: "pitch", label: "Nota", color: "#333",
    draw(ctx, x, y, size, signal) {
      const name = noteName(signal.pitch);
      ctx.font = `bold ${size * 0.28}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = signal.pitch ? "#222" : "#ccc";
      ctx.fillText(name, x, y);
      if (signal.pitch) {
        const norm = Math.min(1, (Math.log2(signal.pitch) - Math.log2(60)) / (Math.log2(1200) - Math.log2(60)));
        const hue = norm * 260;
        ctx.font = `${size * 0.11}px system-ui, sans-serif`;
        ctx.fillStyle = `hsl(${hue}, 60%, 50%)`;
        ctx.fillText(signal.pitch.toFixed(0) + " Hz", x, y + size * 0.22);
      }
    },
    value: (s) => noteName(s.pitch),
  },
];

export const explorerScene = {
  name: "Explorador",

  setup(ctx) {},

  draw(ctx, signal, t) {
    const { width: W, height: H } = ctx.canvas;

    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(0, 0, W, H);

    const COLS = 5;
    const ROWS = 2;
    const padX = W * 0.04;
    const padY = H * 0.08;
    const cellW = (W - padX * 2) / COLS;
    const cellH = (H - padY * 2) / ROWS;
    const cellSize = Math.min(cellW, cellH);

    CELLS.forEach((cell, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx = padX + col * cellW + cellW / 2;
      const cy = padY + row * cellH + cellH / 2;

      // fondo de celda
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(padX + col * cellW + 8, padY + row * cellH + 8, cellW - 16, cellH - 16, 12);
      ctx.fill();
      ctx.strokeStyle = "#ebebeb";
      ctx.lineWidth = 1;
      ctx.stroke();

      // label arriba
      ctx.font = `500 ${cellSize * 0.09}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#aaa";
      ctx.fillText(cell.label.toUpperCase(), cx, padY + row * cellH + 20);

      // valor abajo
      ctx.font = `${cellSize * 0.09}px system-ui, sans-serif`;
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "#bbb";
      ctx.fillText(cell.value(signal), cx, padY + row * cellH + cellH - 16);

      // forma central
      cell.draw(ctx, cx, cy, cellSize * 0.45, signal);
    });
  },
};
