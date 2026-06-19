// Motor de señal: convierte cualquier AnalyserNode en el "contrato" común
// que leen todas las escenas. Las fuentes (audio, micro, MIDI...) solo
// tienen que entregar un AnalyserNode; aquí se normaliza todo a 0–1.

// Autocorrelación: detecta el período fundamental de la forma de onda.
// Devuelve la frecuencia en Hz, o 0 si no hay tono claro.
function detectPitch(wave, sampleRate) {
  const n = wave.length;
  const MIN_HZ = 60;   // La más grave que buscamos (Do2 ≈ 65Hz)
  const MAX_HZ = 1200; // La más aguda (Re6 ≈ 1175Hz)
  const minPeriod = Math.floor(sampleRate / MAX_HZ);
  const maxPeriod = Math.floor(sampleRate / MIN_HZ);

  // Normalizar la onda a -1..+1 alrededor de su media
  let mean = 0;
  for (let i = 0; i < n; i++) mean += wave[i];
  mean /= n;

  // Calcular la autocorrelación para cada período candidato
  let bestCorr = -1;
  let bestPeriod = 0;
  for (let p = minPeriod; p <= maxPeriod && p < n / 2; p++) {
    let corr = 0;
    for (let i = 0; i < n - p; i++) {
      corr += ((wave[i] - mean) / 128) * ((wave[i + p] - mean) / 128);
    }
    corr /= (n - p);
    if (corr > bestCorr) {
      bestCorr = corr;
      bestPeriod = p;
    }
  }

  // Solo devuelve pitch si la correlación es suficientemente clara
  if (bestCorr < 0.01 || bestPeriod === 0) return 0;
  return sampleRate / bestPeriod;
}

export function createSignal(analyser) {
  const freq = new Uint8Array(analyser.frequencyBinCount); // espectro
  const wave = new Uint8Array(analyser.fftSize);           // forma de onda
  const sampleRate = analyser.context.sampleRate;

  // Estado para detección de beat (comparamos energía de graves con su media)
  let bassAvg = 0;
  let lastBeat = 0;
  let pitchSmooth = 0; // pitch suavizado para evitar saltos

  // Promedia un rango de bins del espectro y lo normaliza a 0–1
  function band(from, to) {
    let sum = 0;
    for (let i = from; i < to; i++) sum += freq[i];
    return sum / (to - from) / 255;
  }

  return {
    // Se llama una vez por frame, antes de dibujar
    update() {
      analyser.getByteFrequencyData(freq);
      analyser.getByteTimeDomainData(wave);

      const n = freq.length;
      const bass = band(0, Math.floor(n * 0.08));
      const mid = band(Math.floor(n * 0.08), Math.floor(n * 0.35));
      const treble = band(Math.floor(n * 0.35), n);

      let vol = 0;
      let weighted = 0;
      let total = 0;
      let active = 0;
      const threshold = 30; // bin por encima de este valor cuenta como "activo"
      for (let i = 0; i < n; i++) {
        vol += freq[i];
        weighted += i * freq[i];
        total += freq[i];
        if (freq[i] > threshold) active++;
      }
      vol = vol / n / 255;
      const centroid = total > 0 ? weighted / total / n : 0;
      const density = active / n; // 0=silencio/solo instrumento, 1=mezcla densa

      // Beat: pico de graves por encima de la media reciente
      bassAvg = bassAvg * 0.95 + bass * 0.05;
      const now = performance.now();
      let beat = false;
      if (bass > bassAvg * 1.4 && bass > 0.15 && now - lastBeat > 120) {
        beat = true;
        lastBeat = now;
      }

      // Pitch: solo calcular si hay suficiente volumen (evita ruido en silencio)
      let pitch = 0;
      if (vol > 0.05) {
        const raw = detectPitch(wave, sampleRate);
        if (raw > 0) {
          // suavizado: sube rápido (nueva nota), baja lento
          pitchSmooth = pitchSmooth === 0
            ? raw
            : pitchSmooth * 0.7 + raw * 0.3;
          pitch = pitchSmooth;
        }
      } else {
        pitchSmooth = 0;
      }

      this.bass = bass;
      this.mid = mid;
      this.treble = treble;
      this.volume = vol;
      this.beat = beat;
      this.brightness = centroid;
      this.density = density; // 0=solo/silencio, 1=mezcla muy densa
      this.pitch = pitch;
      this.wave = wave;
      this.freq = freq;
    },

    // Valores iniciales (las escenas siempre encuentran algo)
    bass: 0,
    mid: 0,
    treble: 0,
    volume: 0,
    beat: false,
    brightness: 0,
    density: 0,
    pitch: 0,
    wave,
    freq,
  };
}
