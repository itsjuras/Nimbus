import { useEffect, useRef, useMemo } from "react"

// ── WebGL2 shader ─────────────────────────────────────────────────────────────

const VERT_SRC = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
out vec2 v_uv;
void main(){
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

function makeFragSrc(isDark: boolean) {
  return `#version 300 es
precision highp float;

out vec4 fragColor;
in vec2 v_uv;

uniform vec3  iResolution;
uniform float iTime;
uniform int   iFrame;
uniform vec4  iMouse;

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2  r  = iResolution.xy;
    float t  = iTime;
    vec3  FC = vec3(fragCoord, t);
    vec4  o  = vec4(0.0);

    vec2 p = FC.xy - r * 0.5;

    for (float i, a; i++ < 6.0; )
    {
        a = (i * i) / 40.0 - length(p) / r.y;
        float denom = max(a, -a * 3.0) + 2.0 / r.y;

        a = cos(i - t);
        float edge0 = a;
        float edge1 = 2.0;
        a = atan(p.y, p.x) + a + i * i;
        float sm = smoothstep(edge0, edge1, cos(a));

        o += 0.03 / denom * sm * (1.2 + sin(a + i + vec4(0.0, 2.0, 4.0, 0.0)));
    }

    o = tanh(o);

    // Convert to luminance then tint light blue
    float lum = dot(o.rgb, vec3(0.299, 0.587, 0.114));
    vec3 darkCol  = lum * vec3(0.45, 0.72, 1.0);
    vec3 lightCol = mix(vec3(1.0), vec3(0.35, 0.62, 0.95), lum * 0.85);
    vec3 col = ${isDark ? "darkCol" : "lightCol"};

    fragColor = vec4(col, 1.0);
}

void main(){
  mainImage(fragColor, gl_FragCoord.xy);
}
`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeCompile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  const ok = gl.getShaderParameter(sh, gl.COMPILE_STATUS)
  return { shader: ok ? sh : null, log: gl.getShaderInfoLog(sh) || "" }
}

function safeLink(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader) {
  const prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  const ok = gl.getProgramParameter(prog, gl.LINK_STATUS)
  return { program: ok ? prog : null, log: gl.getProgramInfoLog(prog) || "" }
}

// ── Canvas component ──────────────────────────────────────────────────────────

function ShaderCanvas({ fragSource }: { fragSource: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(0)
  const frameRef = useRef(0)
  const mouseRef = useRef({ x: 0, y: 0, l: 0, r: 0 })

  useEffect(() => {
    const canvas = canvasRef.current!
    const glRaw = canvas.getContext("webgl2", { premultipliedAlpha: false })
    if (!glRaw) return
    const gl = glRaw

    let disposed = false

    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)
    const vbo = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const { shader: vs, log: vsLog } = safeCompile(gl, gl.VERTEX_SHADER, VERT_SRC)
    if (!vs) { console.error("Vertex compile error:", vsLog); return cleanup }
    const { shader: fs, log: fsLog } = safeCompile(gl, gl.FRAGMENT_SHADER, fragSource)
    if (!fs) { console.error("Fragment compile error:", fsLog); gl.deleteShader(vs); return cleanup }
    const { program, log: linkLog } = safeLink(gl, vs, fs)
    gl.deleteShader(vs); gl.deleteShader(fs)
    if (!program) { console.error("Link error:", linkLog); return cleanup }

    const uResolution = gl.getUniformLocation(program, "iResolution")
    const uTime = gl.getUniformLocation(program, "iTime")
    const uFrame = gl.getUniformLocation(program, "iFrame")
    const uMouse = gl.getUniformLocation(program, "iMouse")

    let resizeScheduled = false
    function applySize() {
      resizeScheduled = false
      if (disposed) return
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h
        gl.viewport(0, 0, w, h)
      }
    }
    const ro = new ResizeObserver(() => { resizeScheduled = true; requestAnimationFrame(applySize) })
    ro.observe(canvas)
    resizeScheduled = true
    requestAnimationFrame(applySize)

    function onMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = e.clientX - rect.left
      mouseRef.current.y = rect.height - (e.clientY - rect.top)
    }
    function onDown(e: MouseEvent) { if (e.button === 0) mouseRef.current.l = 1 }
    function onUp(e: MouseEvent) { if (e.button === 0) mouseRef.current.l = 0 }
    canvas.addEventListener("mousemove", onMove)
    canvas.addEventListener("mousedown", onDown)
    canvas.addEventListener("mouseup", onUp)

    startRef.current = performance.now()
    frameRef.current = 0

    function tick(now: number) {
      if (disposed || gl.isContextLost()) { rafRef.current = requestAnimationFrame(tick); return }
      const t = (now - startRef.current) / 1000
      frameRef.current += 1
      if (resizeScheduled) applySize()

      gl.useProgram(program)
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
      uResolution && gl.uniform3f(uResolution, canvas.width, canvas.height, dpr)
      uTime && gl.uniform1f(uTime, t)
      uFrame && gl.uniform1i(uFrame, frameRef.current)
      uMouse && gl.uniform4f(uMouse, mouseRef.current.x * dpr, mouseRef.current.y * dpr, mouseRef.current.l, 0)
      gl.bindVertexArray(vao)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    function cleanup() {
      disposed = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      canvas.removeEventListener("mousemove", onMove)
      canvas.removeEventListener("mousedown", onDown)
      canvas.removeEventListener("mouseup", onUp)
      ro.disconnect()
      try { gl.deleteBuffer(vbo) } catch {}
      try { gl.deleteVertexArray(vao) } catch {}
    }
    return cleanup
  }, [fragSource])

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export function ShaderBackground({ isDark }: { isDark: boolean }) {
  const fragSource = useMemo(() => makeFragSrc(isDark), [isDark])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
      }}
    >
      <ShaderCanvas fragSource={fragSource} />
    </div>
  )
}
