'use client';

import { useEffect, useRef } from 'react';

interface MeshGradientProps {
  colors?: string[];
  className?: string;
  variant?: 'hero' | 'cta' | 'steps' | 'agents';
}

const DEFAULT_COLORS = ['#00D4FF', '#F4B728', '#8FE1FF', '#FFE876'];

const SHADERS = {
  noise: `vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`,
  blend: `vec3 blendNormal(vec3 base,vec3 blend){return blend;}vec3 blendNormal(vec3 base,vec3 blend,float opacity){return(blendNormal(base,blend)*opacity+base*(1.0-opacity));}`,
  vertex: `varying vec3 v_color;\nvoid main(){float time=u_time*u_global.noiseSpeed;vec2 noiseCoord=resolution*uvNorm*u_global.noiseFreq;vec2 st=1.-uvNorm.xy;float tilt=resolution.y/2.0*uvNorm.y;float incline=resolution.x*uvNorm.x/2.0*u_vertDeform.incline;float offset=resolution.x/2.0*u_vertDeform.incline*mix(u_vertDeform.offsetBottom,u_vertDeform.offsetTop,uv.y);float noise=snoise(vec3(noiseCoord.x*u_vertDeform.noiseFreq.x+time*u_vertDeform.noiseFlow,noiseCoord.y*u_vertDeform.noiseFreq.y,time*u_vertDeform.noiseSpeed+u_vertDeform.noiseSeed))*u_vertDeform.noiseAmp;noise*=1.0-pow(abs(uvNorm.y),2.0);noise=max(0.0,noise);vec3 pos=vec3(position.x,position.y+tilt+incline+noise-offset,position.z);if(u_active_colors[0]==1.){v_color=u_baseColor;}for(int i=0;i<u_waveLayers_length;i++){if(u_active_colors[i+1]==1.){WaveLayers layer=u_waveLayers[i];float noise=smoothstep(layer.noiseFloor,layer.noiseCeil,snoise(vec3(noiseCoord.x*layer.noiseFreq.x+time*layer.noiseFlow,noiseCoord.y*layer.noiseFreq.y,time*layer.noiseSpeed+layer.noiseSeed))/2.0+0.5);v_color=blendNormal(v_color,layer.color,pow(noise,4.));}}gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);}`,
  fragment: `varying vec3 v_color;\nvoid main(){vec3 color=v_color;gl_FragColor=vec4(color,1.0);}`,
};

function normalizeColor(hex: string): number[] {
  if (hex.length === 4) hex = '#' + hex.slice(1).split('').map(c => c + c).join('');
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (255 & n) / 255];
}

function initGradient(canvas: HTMLCanvasElement, colors: string[]): (() => void) | undefined {
  const gl = canvas.getContext('webgl', { antialias: true });
  if (!gl) return;

  const sectionColors = colors.map(normalizeColor);
  const seed = 5;
  let t = 1253106;
  let last = 0;
  let playing = true;
  let meshRef: { geometry: any; material: any } | null = null;
  let minigl: any = null;

  // --- MiniGL engine (compacted Stripe reverse-engineer) ---
  const meshes: any[] = [];
  const commonUniforms: Record<string, any> = {};

  function mkUniform(opts: any) {
    const u: any = { type: 'float', ...opts };
    u.typeFn = ({ float: '1f', int: '1i', vec2: '2fv', vec3: '3fv', vec4: '4fv', mat4: 'Matrix4fv' } as any)[u.type] || '1f';
    u.update = function (loc: WebGLUniformLocation | null) {
      if (u.value !== undefined) {
        (gl as any)[`uniform${u.typeFn}`](
          loc,
          u.typeFn.indexOf('Matrix') === 0 ? u.transpose : u.value,
          u.typeFn.indexOf('Matrix') === 0 ? u.value : null
        );
      }
    };
    u.getDeclaration = function (name: string, type: string, length?: number): string {
      if (u.excludeFrom === type) return '';
      if (u.type === 'array')
        return u.value[0].getDeclaration(name, type, u.value.length) + `\nconst int ${name}_length = ${u.value.length};`;
      if (u.type === 'struct') {
        let n = name.replace('u_', '');
        n = n.charAt(0).toUpperCase() + n.slice(1);
        return `uniform struct ${n} {\n` +
          Object.entries(u.value).map(([k, v]: [string, any]) => v.getDeclaration(k, type).replace(/^uniform/, '')).join('') +
          `\n} ${name}${(length ?? 0) > 0 ? `[${length}]` : ''};`;
      }
      return `uniform ${u.type} ${name}${(length ?? 0) > 0 ? `[${length}]` : ''};`;
    };
    return u;
  }

  function decl(uniforms: Record<string, any>, type: string) {
    return Object.entries(uniforms).map(([n, v]) => v.getDeclaration(n, type)).join('\n');
  }

  function mkShader(type: number, src: string) {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    return s;
  }

  function createMaterial(vs: string, fs: string, uniforms: Record<string, any>) {
    const mat: any = { uniforms, uniformInstances: [] };
    const pfx = '\n precision highp float;\n ';
    mat.vertexSource = `\n ${pfx}\n attribute vec4 position;\n attribute vec2 uv;\n attribute vec2 uvNorm;\n ${decl(commonUniforms, 'vertex')}\n ${decl(uniforms, 'vertex')}\n ${vs}\n `;
    mat.fragSource = `\n ${pfx}\n ${decl(commonUniforms, 'fragment')}\n ${decl(uniforms, 'fragment')}\n ${fs}\n `;
    mat.vertexShader = mkShader(gl!.VERTEX_SHADER, mat.vertexSource);
    mat.fragmentShader = mkShader(gl!.FRAGMENT_SHADER, mat.fragSource);
    mat.program = gl!.createProgram()!;
    gl!.attachShader(mat.program, mat.vertexShader);
    gl!.attachShader(mat.program, mat.fragmentShader);
    gl!.linkProgram(mat.program);
    gl!.useProgram(mat.program);

    function attachUniforms(name: string | undefined, u: any) {
      if (name === undefined) {
        Object.entries(u).forEach(([n, v]) => attachUniforms(n, v));
      } else if (u.type === 'array') {
        u.value.forEach((v: any, i: number) => attachUniforms(`${name}[${i}]`, v));
      } else if (u.type === 'struct') {
        Object.entries(u.value).forEach(([n, v]) => attachUniforms(`${name}.${n}`, v));
      } else {
        mat.uniformInstances.push({ uniform: u, location: gl!.getUniformLocation(mat.program, name) });
      }
    }
    attachUniforms(undefined, commonUniforms);
    attachUniforms(undefined, uniforms);
    return mat;
  }

  function createAttribute(opts: any) {
    const a: any = { type: gl!.FLOAT, normalized: false, buffer: gl!.createBuffer(), ...opts };
    a.update = () => {
      if (a.values !== undefined) { gl!.bindBuffer(a.target, a.buffer); gl!.bufferData(a.target, a.values, gl!.STATIC_DRAW); }
    };
    a.attach = (name: string, program: WebGLProgram) => {
      const loc = gl!.getAttribLocation(program, name);
      if (a.target === gl!.ARRAY_BUFFER) { gl!.enableVertexAttribArray(loc); gl!.vertexAttribPointer(loc, a.size, a.type, a.normalized, 0, 0); }
      return loc;
    };
    a.use = (loc: number) => {
      gl!.bindBuffer(a.target, a.buffer);
      if (a.target === gl!.ARRAY_BUFFER) { gl!.enableVertexAttribArray(loc); gl!.vertexAttribPointer(loc, a.size, a.type, a.normalized, 0, 0); }
    };
    a.update();
    return a;
  }

  function createGeometry() {
    gl!.createBuffer();
    const geo: any = {
      attributes: {
        position: createAttribute({ target: gl!.ARRAY_BUFFER, size: 3 }),
        uv: createAttribute({ target: gl!.ARRAY_BUFFER, size: 2 }),
        uvNorm: createAttribute({ target: gl!.ARRAY_BUFFER, size: 2 }),
        index: createAttribute({ target: gl!.ELEMENT_ARRAY_BUFFER, size: 3, type: gl!.UNSIGNED_SHORT }),
      },
    };
    geo.setTopology = (xSeg = 1, ySeg = 1) => {
      geo.xSegCount = xSeg; geo.ySegCount = ySeg;
      geo.vertexCount = (xSeg + 1) * (ySeg + 1);
      geo.quadCount = xSeg * ySeg * 2;
      geo.attributes.uv.values = new Float32Array(2 * geo.vertexCount);
      geo.attributes.uvNorm.values = new Float32Array(2 * geo.vertexCount);
      geo.attributes.index.values = new Uint16Array(3 * geo.quadCount);
      for (let y = 0; y <= ySeg; y++) for (let x = 0; x <= xSeg; x++) {
        const i = y * (xSeg + 1) + x;
        geo.attributes.uv.values[2 * i] = x / xSeg;
        geo.attributes.uv.values[2 * i + 1] = 1 - y / ySeg;
        geo.attributes.uvNorm.values[2 * i] = (x / xSeg) * 2 - 1;
        geo.attributes.uvNorm.values[2 * i + 1] = 1 - (y / ySeg) * 2;
        if (x < xSeg && y < ySeg) {
          const s = y * xSeg + x;
          geo.attributes.index.values[6 * s] = i;
          geo.attributes.index.values[6 * s + 1] = i + 1 + xSeg;
          geo.attributes.index.values[6 * s + 2] = i + 1;
          geo.attributes.index.values[6 * s + 3] = i + 1;
          geo.attributes.index.values[6 * s + 4] = i + 1 + xSeg;
          geo.attributes.index.values[6 * s + 5] = i + 2 + xSeg;
        }
      }
      geo.attributes.uv.update(); geo.attributes.uvNorm.update(); geo.attributes.index.update();
    };
    geo.setSize = (w = 1, h = 1, orientation = 'xz') => {
      geo.width = w; geo.height = h;
      if (!geo.attributes.position.values || geo.attributes.position.values.length !== 3 * geo.vertexCount)
        geo.attributes.position.values = new Float32Array(3 * geo.vertexCount);
      const ox = w / -2, oy = h / -2, sw = w / geo.xSegCount, sh = h / geo.ySegCount;
      for (let yi = 0; yi <= geo.ySegCount; yi++) {
        const ty = oy + yi * sh;
        for (let xi = 0; xi <= geo.xSegCount; xi++) {
          const rx = ox + xi * sw, l = yi * (geo.xSegCount + 1) + xi;
          geo.attributes.position.values[3 * l + 'xyz'.indexOf(orientation[0])] = rx;
          geo.attributes.position.values[3 * l + 'xyz'.indexOf(orientation[1])] = -ty;
        }
      }
      geo.attributes.position.update();
    };
    return geo;
  }

  function createMesh(geometry: any, material: any) {
    const mesh: any = { geometry, material, wireframe: false, attributeInstances: [] as any[] };
    Object.entries(geometry.attributes).forEach(([name, attr]: [string, any]) => {
      mesh.attributeInstances.push({ attribute: attr, location: attr.attach(name, material.program) });
    });
    meshes.push(mesh);
    mesh.draw = () => {
      gl!.useProgram(material.program);
      material.uniformInstances.forEach(({ uniform: u, location: loc }: any) => u.update(loc));
      mesh.attributeInstances.forEach(({ attribute: a, location: loc }: any) => a.use(loc));
      gl!.drawElements(gl!.TRIANGLES, geometry.attributes.index.values.length, gl!.UNSIGNED_SHORT, 0);
    };
    return mesh;
  }

  // --- Init ---
  let width = 0, height = 0;

  function setSize(w: number, h: number) {
    width = w; height = h;
    canvas.width = w; canvas.height = h;
    gl!.viewport(0, 0, w, h);
    commonUniforms.resolution.value = [w, h];
    commonUniforms.aspectRatio.value = w / h;
  }

  function setCamera() {
    commonUniforms.projectionMatrix.value = [2 / width, 0, 0, 0, 0, 2 / height, 0, 0, 0, 0, 2 / (-2e3 - 2e3), 0, 0, 0, 0, 1];
  }

  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  commonUniforms.projectionMatrix = mkUniform({ type: 'mat4', value: identity });
  commonUniforms.modelViewMatrix = mkUniform({ type: 'mat4', value: identity });
  commonUniforms.resolution = mkUniform({ type: 'vec2', value: [1, 1] });
  commonUniforms.aspectRatio = mkUniform({ type: 'float', value: 1 });

  const uniforms: Record<string, any> = {
    u_time: mkUniform({ value: 0 }),
    u_shadow_power: mkUniform({ value: 5 }),
    u_darken_top: mkUniform({ value: 0 }),
    u_active_colors: mkUniform({ value: [1, 1, 1, 1], type: 'vec4' }),
    u_global: mkUniform({ value: {
      noiseFreq: mkUniform({ value: [14e-5, 29e-5], type: 'vec2' }),
      noiseSpeed: mkUniform({ value: 5e-6 }),
    }, type: 'struct' }),
    u_vertDeform: mkUniform({ value: {
      incline: mkUniform({ value: 0 }),
      offsetTop: mkUniform({ value: -0.5 }),
      offsetBottom: mkUniform({ value: -0.5 }),
      noiseFreq: mkUniform({ value: [3, 4], type: 'vec2' }),
      noiseAmp: mkUniform({ value: 320 }),
      noiseSpeed: mkUniform({ value: 10 }),
      noiseFlow: mkUniform({ value: 3 }),
      noiseSeed: mkUniform({ value: seed }),
    }, type: 'struct', excludeFrom: 'fragment' }),
    u_baseColor: mkUniform({ value: sectionColors[0], type: 'vec3', excludeFrom: 'fragment' }),
    u_waveLayers: mkUniform({ value: [] as any[], excludeFrom: 'fragment', type: 'array' }),
  };

  for (let i = 1; i < sectionColors.length; i++) {
    uniforms.u_waveLayers.value.push(mkUniform({ value: {
      color: mkUniform({ value: sectionColors[i], type: 'vec3' }),
      noiseFreq: mkUniform({ value: [2 + i / sectionColors.length, 3 + i / sectionColors.length], type: 'vec2' }),
      noiseSpeed: mkUniform({ value: 11 + 0.3 * i }),
      noiseFlow: mkUniform({ value: 6.5 + 0.3 * i }),
      noiseSeed: mkUniform({ value: seed + 10 * i }),
      noiseFloor: mkUniform({ value: 0.1 }),
      noiseCeil: mkUniform({ value: 0.63 + 0.07 * i }),
    }, type: 'struct' }));
  }

  const vertexShader = [SHADERS.noise, SHADERS.blend, SHADERS.vertex].join('\n\n');
  const material = createMaterial(vertexShader, SHADERS.fragment, uniforms);
  const geometry = createGeometry();
  const mesh = createMesh(geometry, material);
  meshRef = mesh;
  minigl = { render: () => { gl!.clearColor(0, 0, 0, 0); gl!.clearDepth(1); meshes.forEach(m => m.draw()); } };

  function resize() {
    const wrapper = canvas.parentElement;
    if (!wrapper) return;
    const w = wrapper.offsetWidth;
    const h = wrapper.offsetHeight;
    setSize(w, h);
    setCamera();
    mesh.geometry.setTopology(Math.ceil(w * 0.06), Math.ceil(h * 0.16));
    mesh.geometry.setSize(w, h);
  }

  let animId: number;
  function animate(e: number) {
    if (!playing) return;
    if (!document.hidden && e % 2 !== 0) {
      t += Math.min(e - last, 1000 / 15);
      last = e;
      uniforms.u_time.value = t;
      minigl.render();
    }
    animId = requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize', resize);
  animId = requestAnimationFrame(animate);

  return () => {
    playing = false;
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
  };
}

const VARIANTS = {
  hero: {
    transform: 'rotate(-15deg)',
    transformOrigin: '70% 30%',
    mask: 'radial-gradient(ellipse 42% 80% at 80% 38%, black 0%, rgba(0,0,0,0.45) 40%, transparent 72%)',
  },
  cta: {
    transform: 'rotate(15deg) scaleX(-1)',
    transformOrigin: '30% 70%',
    mask: 'radial-gradient(ellipse 42% 80% at 80% 38%, black 0%, rgba(0,0,0,0.45) 40%, transparent 72%)',
  },
  steps: {
    transform: 'rotate(2deg)',
    transformOrigin: '50% 60%',
    mask: 'radial-gradient(ellipse 90% 35% at 50% 72%, black 0%, rgba(0,0,0,0.4) 45%, transparent 75%)',
  },
  agents: {
    transform: 'rotate(-5deg)',
    transformOrigin: '40% 50%',
    mask: 'radial-gradient(ellipse 50% 55% at 30% 50%, black 0%, rgba(0,0,0,0.35) 40%, transparent 72%)',
  },
} as const;

export function MeshGradient({ colors = DEFAULT_COLORS, className, variant = 'hero' }: MeshGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const cleanup = initGradient(canvasRef.current, colors);
    return cleanup;
  }, [colors]);

  const v = VARIANTS[variant];

  return (
    <div
      aria-hidden="true"
      className={`mesh-gradient${className ? ` ${className}` : ''}`}
      style={{
        position: 'absolute',
        inset: '-30%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.7,
        transform: v.transform,
        transformOrigin: v.transformOrigin,
        WebkitMaskImage: v.mask,
        maskImage: v.mask,
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
