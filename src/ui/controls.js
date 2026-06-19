// Panel de controles en tiempo real.
// Exporta `params`: cualquier escena puede importarlo y leer sus valores.
// Los sliders actualizan params en vivo sin recargar nada.

export const params = {
  smooth: 0.75,   // suavizado temporal de la onda
  gain: 1.4,      // amplitud vertical
  span: 180,      // recorrido del arcoíris (°) — reducido para menos hippie
  colorShift: 30, // cuánto se mueve el color con el brillo del sonido
  thickness: 6,   // grosor máximo de línea
  ampColor: 30,   // desplazamiento de hue en los picos de amplitud (°)
};

const SLIDERS = [
  { key: "smooth",    label: "Suavizado",   min: 0,   max: 0.97, step: 0.01 },
  { key: "gain",      label: "Amplitud",    min: 0.5, max: 16,   step: 0.1  },
  { key: "span",      label: "Arcoíris",    min: 60,  max: 360,  step: 1    },
  { key: "colorShift",label: "Mov. color",  min: 0,   max: 200,  step: 1    },
  { key: "thickness", label: "Grosor",      min: 0,   max: 16,   step: 0.5  },
  { key: "ampColor",  label: "Color picos", min: 0,   max: 360,  step: 1    },
];

export function mountControls() {
  const panel = document.createElement("div");
  panel.id = "controls";
  panel.innerHTML = `
    <p class="ctrl-title">Parámetros</p>
    ${SLIDERS.map(s => `
      <div class="ctrl-row">
        <span class="ctrl-label">${s.label}</span>
        <input type="range" data-key="${s.key}"
          min="${s.min}" max="${s.max}" step="${s.step}"
          value="${params[s.key]}" />
        <span class="ctrl-val" data-val="${s.key}">${params[s.key]}</span>
      </div>
    `).join("")}
  `;

  document.body.appendChild(panel);

  panel.querySelectorAll("input[type=range]").forEach(input => {
    input.addEventListener("input", () => {
      const key = input.dataset.key;
      params[key] = parseFloat(input.value);
      panel.querySelector(`[data-val="${key}"]`).textContent =
        parseFloat(input.value).toFixed(2);
    });
  });
}
