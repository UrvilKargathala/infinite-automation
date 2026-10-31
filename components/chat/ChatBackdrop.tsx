"use client";

import { useEffect, useRef, useState } from "react";

const VERTEX = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

// Domain-warped flow field: the coordinates are bent a few times by slow sine waves, then four brand colours
// are blended along the warped field — the same liquid look as a looping gradient video, but rendered live.
const FRAGMENT = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (uv - 0.5) * vec2(u_res.x / u_res.y, 1.0) * 1.5;
  float t = u_time * 0.14;
  for (int i = 1; i < 5; i++) {
    float f = float(i);
    p.x += 0.7 / f * sin(f * 1.4 * p.y + t + 0.0);
    p.y += 0.7 / f * cos(f * 1.4 * p.x + t * 1.2 + 3.0);
  }
  float a = 0.5 + 0.5 * sin(p.x * 1.3 + p.y * 0.6 + t * 0.7);
  float b = 0.5 + 0.5 * sin(p.y * 1.6 - p.x * 0.8 + 2.0 - t * 0.5);
  float c = 0.5 + 0.5 * sin(p.x * 0.9 - p.y * 1.2 + 4.0 + t * 0.4);

  vec3 base   = vec3(0.925, 0.957, 0.980);
  vec3 blue   = vec3(0.447, 0.690, 0.890);
  vec3 green  = vec3(0.560, 0.830, 0.600);
  vec3 teal   = vec3(0.470, 0.870, 0.800);
  vec3 violet = vec3(0.730, 0.690, 0.950);

  vec3 col = mix(blue, green, smoothstep(0.15, 0.85, a));
  col = mix(col, teal, smoothstep(0.35, 0.9, b) * 0.85);
  col = mix(col, violet, smoothstep(0.55, 1.0, c) * 0.6);
  col = mix(base, col, 0.62);
  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

/**
 * Live fluid backdrop for a chat feed: a slow, looping liquid gradient that behaves like an animated video.
 * Drawn with a tiny WebGL shader at half resolution (soft by nature), paused while the tab is hidden and frozen
 * for people who prefer reduced motion. If WebGL isn't available the CSS blobs underneath (.chat-fluid) stay.
 * Fill a `relative` parent.
 */
export function ChatBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0;
    let last = 0;

    function resize() {
      if (!canvas || !gl) return;
      const w = Math.max(1, Math.round(canvas.clientWidth * 0.5));
      const h = Math.max(1, Math.round(canvas.clientHeight * 0.5));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function draw(now: number) {
      if (!gl) return;
      resize();
      gl.uniform2f(uRes, canvas!.width, canvas!.height);
      gl.uniform1f(uTime, ((now - start) / 1000) % 3600);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (now - last < 33) return; // ~30fps is plenty for a slow flow and easy on laptops
      last = now;
      draw(now);
    }

    function onVisibility() {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(frame);
    }

    draw(start + 12000); // first frame right away, so the fade-in never shows an empty canvas
    setLive(true);
    if (!reduced) raf = requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", onVisibility);
    const ro = new ResizeObserver(() => draw(performance.now()));
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      // Free the GPU objects but leave the context alive: React strict mode re-runs this effect on the same canvas.
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <div className="chat-fluid" aria-hidden>
      <i />
      <i />
      <i />
      <i />
      <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${live ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}
