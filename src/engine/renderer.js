// Motor de render: ajusta el canvas a la pantalla y corre el bucle.
// Llama a signal.update() y luego a la escena activa cada frame.

export function createRenderer(canvas, signal) {
  const ctx = canvas.getContext("2d");
  let scene = null;
  let running = false;
  let start = performance.now();

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    // las escenas dibujan usando canvas.width/height (el buffer real),
    // así la nitidez en pantallas retina es automática
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }
  window.addEventListener("resize", resize);
  resize();

  function loop() {
    if (!running) return;
    signal.update();
    if (scene) scene.draw(ctx, signal, (performance.now() - start) / 1000);
    requestAnimationFrame(loop);
  }

  return {
    setScene(s) {
      scene = s;
      scene.setup && scene.setup(ctx);
    },
    start() {
      if (running) return;
      running = true;
      requestAnimationFrame(loop);
    },
    stop() {
      running = false;
    },
  };
}
