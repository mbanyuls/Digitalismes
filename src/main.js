// Punto de entrada: conecta las tres capas.
// fuente (audio) -> motor de señal -> motor de render -> escena

import { createAudioFileSource } from "./sources/audioFile.js";
import { createSignal } from "./engine/signal.js";
import { createRenderer } from "./engine/renderer.js";
import { waveScene } from "./scenes/wave.js";
import { explorerScene } from "./scenes/explorer.js";
import { albufScene } from "./scenes/albufera.js";
import { donesScene } from "./scenes/dones.js";
import { onaScene } from "./scenes/ona.js";
import { ona2Scene } from "./scenes/ona2.js";
import { atardecerScene } from "./scenes/atardecer.js";
import { marScene } from "./scenes/mar.js";
import { mountControls } from "./ui/controls.js";

mountControls();

const canvas = document.getElementById("stage");
const fileInput = document.getElementById("file");
const playBtn = document.getElementById("playpause");
const sceneSelect = document.getElementById("scenebtn");
const status = document.getElementById("status");

const scenes = [waveScene, explorerScene, albufScene, donesScene, onaScene, ona2Scene, atardecerScene, marScene];
let sceneIndex = 0;
let source = null;
let renderer = null;

// Poblar el desplegable
scenes.forEach((scene, i) => {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = scene.name;
  sceneSelect.appendChild(opt);
});

sceneSelect.addEventListener("change", () => {
  sceneIndex = parseInt(sceneSelect.value);
  if (renderer) renderer.setScene(scenes[sceneIndex]);
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!source) {
    source = createAudioFileSource();
    const signal = createSignal(source.analyser);
    renderer = createRenderer(canvas, signal);
    renderer.setScene(scenes[sceneIndex]);
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
