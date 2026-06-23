// Panel de controles exclusivo para la escena Crestes.
// Misma estructura que controls.js pero con parámetros propios.

export const crestesParams = {
  speed:     2,    // frames entre capturas (1=más rápido, 5=más lento)
  lines:     55,   // líneas en pantalla
  amp:       1.0,  // multiplicador de altura de picos
  freqRange: 0.60, // fracción del espectro visible (0.2=solo graves, 0.9=todo)
};

const SLIDERS = [
  { key: "speed",     label: "Velocitat",   min: 1,   max: 5,   step: 1    },
  { key: "lines",     label: "Línies",      min: 20,  max: 90,  step: 1    },
  { key: "amp",       label: "Alçada pics", min: 0.2, max: 3.0, step: 0.1  },
  { key: "freqRange", label: "Rang freq.",  min: 0.1, max: 0.9, step: 0.05 },
];

export function mountCrestesControls() {
  const panel = document.createElement("div");
  panel.id = "controls-crestes";
  panel.innerHTML = `
    <p class="ctrl-title">Crestes</p>
    ${SLIDERS.map(s => `
      <div class="ctrl-row">
        <span class="ctrl-label">${s.label}</span>
        <input type="range" data-key="${s.key}"
          min="${s.min}" max="${s.max}" step="${s.step}"
          value="${crestesParams[s.key]}" />
        <span class="ctrl-val" data-val="${s.key}">${crestesParams[s.key]}</span>
      </div>
    `).join("")}
  `;

  document.body.appendChild(panel);

  panel.querySelectorAll("input[type=range]").forEach(input => {
    input.addEventListener("input", () => {
      const key = input.dataset.key;
      crestesParams[key] = parseFloat(input.value);
      panel.querySelector(`[data-val="${key}"]`).textContent =
        parseFloat(input.value).toFixed(2);
    });
  });
}
