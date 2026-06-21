// Escena: Ona
// Fondo: color según longitud de onda (pitch), opacidad según amplitud.
// Onda: graves = ondulación lenta y grande | medios = media | agudos = rápida y fina.
// Grosor: volumen → lineWidth.
// Beat: destello luminoso radial desde el centro.

export const onaScene = {
  name: "Ona",

  setup() {
    this.beatEnv  = 0;
    this.pitchS   = 0.5;  // longitud de onda suavizada
    this.ampS     = 0;
    this.volS     = 0;
    this.bassS    = 0;
    this.midS     = 0;
    this.trebleS  = 0;
  },

  draw(ctx, signal, t) {
    const { width: W, height: H } = ctx.canvas;

    // suavizados (respuesta distinta por banda)
    this.ampS    = this.ampS    * 0.88 + signal.volume  * 0.12;
    this.volS    = this.volS    * 0.92 + signal.volume  * 0.08;
    this.bassS   = this.bassS   * 0.84 + signal.bass    * 0.16;
    this.midS    = this.midS    * 0.84 + signal.mid     * 0.16;
    this.trebleS = this.trebleS * 0.84 + signal.treble  * 0.16;

    // pitch → normalizado 0-1 (60 Hz grave = 0, 1200 Hz agudo = 1)
    const pn = signal.pitch > 0
      ? Math.min(1, (Math.log2(signal.pitch) - Math.log2(60)) / (Math.log2(1200) - Math.log2(60)))
      : this.pitchS;
    this.pitchS = this.pitchS * 0.97 + pn * 0.03;

    if (signal.beat) this.beatEnv = 1.0;
    this.beatEnv *= 0.86;

    // longitud de onda larga (pitch grave) → tonos cálidos (rojo/naranja, hue 0°)
    // longitud de onda corta (pitch agudo) → tonos fríos (azul/violeta, hue 260°)
    const hue  = this.pitchS * 260;
    const wHue = (hue + 40) % 360; // onda un poco más hacia el complementario

    // 1 · FONDO NEGRO BASE
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // 2 · CAPA DE COLOR — pitch → tono, amplitud → opacidad
    const bgAlpha = 0.06 + this.ampS * 0.82;
    ctx.fillStyle = `hsla(${hue}, 78%, 32%, ${bgAlpha})`;
    ctx.fillRect(0, 0, W, H);

    // 3 · ONDA COMPUESTA (graves + medios + agudos)
    const cy      = H / 2;
    const bassAmp = this.bassS   * H * 0.32;  // grande y lenta
    const midAmp  = this.midS    * H * 0.14;  // media
    const trbAmp  = this.trebleS * H * 0.06;  // rápida y fina

    // grosor según volumen total
    const lw = 1.5 + this.volS * 11;

    // función de onda — misma curva dibujada 3 veces (halo → línea central)
    const drawWave = (width, alpha) => {
      ctx.strokeStyle = `hsla(${wHue}, 88%, 68%, ${alpha})`;
      ctx.lineWidth   = width;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.beginPath();
      for (let i = 0; i <= W; i++) {
        const xn = i / W;
        const y  = cy
          - bassAmp * Math.sin(xn * Math.PI * 2 * 2.2  + t * 0.65)
          - midAmp  * Math.sin(xn * Math.PI * 2 * 7.0  + t * 1.55 + 1.1)
          - trbAmp  * Math.sin(xn * Math.PI * 2 * 22.0 + t * 3.1  + 2.3);
        i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
      }
      ctx.stroke();
    };

    drawWave(lw * 5, 0.07);  // halo exterior difuso
    drawWave(lw * 2, 0.25);  // halo interior
    drawWave(lw,     0.92);  // línea central nítida

    // 4 · DESTELLO DE BEAT — gradiente radial desde el centro
    if (this.beatEnv > 0.02) {
      const cx  = W / 2;
      const cy2 = H / 2;
      const r   = Math.max(W, H) * 0.78;

      const flash = ctx.createRadialGradient(cx, cy2, 0, cx, cy2, r);
      flash.addColorStop(0,    `rgba(255,255,255, ${this.beatEnv * 0.92})`);
      flash.addColorStop(0.12, `hsla(${wHue}, 100%, 82%, ${this.beatEnv * 0.70})`);
      flash.addColorStop(0.40, `hsla(${wHue}, 90%,  55%, ${this.beatEnv * 0.28})`);
      flash.addColorStop(1,    `rgba(0,0,0, 0)`);
      ctx.fillStyle = flash;
      ctx.fillRect(0, 0, W, H);

      // la onda también se vuelve blanca en el beat
      ctx.strokeStyle = `rgba(255,255,255, ${this.beatEnv * 0.85})`;
      ctx.lineWidth   = lw * 1.6;
      ctx.beginPath();
      for (let i = 0; i <= W; i++) {
        const xn = i / W;
        const y  = cy
          - bassAmp * Math.sin(xn * Math.PI * 2 * 2.2  + t * 0.65)
          - midAmp  * Math.sin(xn * Math.PI * 2 * 7.0  + t * 1.55 + 1.1)
          - trbAmp  * Math.sin(xn * Math.PI * 2 * 22.0 + t * 3.1  + 2.3);
        i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
      }
      ctx.stroke();
    }
  },
};
