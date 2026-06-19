// Fuente: archivo de música.
// Crea el AudioContext, conecta el <audio> a un AnalyserNode y lo devuelve.
// El resto del proyecto no sabe ni le importa que el sonido venga de un MP3.

export function createAudioFileSource() {
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;

  const audio = new Audio();
  audio.crossOrigin = "anonymous";

  const source = ctx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(ctx.destination); // para que también se oiga

  return {
    analyser,

    // Carga un File (del <input type="file">)
    load(file) {
      audio.src = URL.createObjectURL(file);
    },

    async play() {
      if (ctx.state === "suspended") await ctx.resume();
      await audio.play();
    },

    pause() {
      audio.pause();
    },

    get playing() {
      return !audio.paused;
    },

    onEnded(cb) {
      audio.addEventListener("ended", cb);
    },
  };
}
