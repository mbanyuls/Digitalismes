// Punto de entrada: conecta las tres capas.
// fuente (audio) -> motor de señal -> motor de render -> escena

import { createAudioFileSource } from "./sources/audioFile.js";
import { createSignal } from "./engine/signal.js";
import { createRenderer } from "./engine/renderer.js";
import { lineScene } from "./scenes/line.js";
import { waveScene } from "./scenes/wave.js";
import { mountControls } from "./ui/controls.js";

mountControls();

const canvas = document.getElementById("stage");
const fileInput = document.getElementById("file");
const playBtn = document.getElementById("playpause");
const status = document.getElementById("status");

let source = null;
let renderer = null;

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // El AudioContext debe crearse tras un gesto del usuario (cargar archivo)
  if (!source) {
    source = createAudioFileSource();
    const signal = createSignal(source.analyser);
    renderer = createRenderer(canvas, signal);
    renderer.setScene(waveScene); // <- aquí se cambia de visual
    renderer.start();
    source.onEnded(() => {
      playBtn.textContent = "Play";
      status.textContent = "Fin de la pista";
    });
  }

  source.load(file);
  playBtn.disabled = false;
  status.textContent = file.name;
});

playBtn.addEventListener("click", async () => {
  if (!source) return;
  if (source.playing) {
    source.pause();
    playBtn.textContent = "Play";
  } else {
    await source.play();
    playBtn.textContent = "Pause";
  }
});
