"use client"

import React from "react"

import { useRef, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, shaderMaterial } from "@react-three/drei"
import { Menu } from "lucide-react"
import * as THREE from "three"
import { extend } from "@react-three/fiber"
import JapaneseHeading from "../japanese-heading"
import "./japanese-heading.css"

// Create a custom shader material for the gradient effect
const GradientMaterial = shaderMaterial(
  {
    time: 0,
    distort: 0.3,
    speed: 2,
    yellowColor: new THREE.Color("#4a9eff"),
    greenColor: new THREE.Color("#0046b8"),
    noiseTexture: null,
    hovered: 0,
  },
  // Vertex shader with modified distortion for more angular look
  `
    uniform float time;
    uniform float distort;
    uniform float speed;
    uniform float hovered;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    //
    // GLSL textureless classic 3D noise "cnoise",
    // with an RSL-style periodic variant "pnoise".
    // Author:  Stefan Gustavson (stefan.gustavson@liu.se)
    // Version: 2011-10-11
    //
    // Many thanks to Ian McEwan of Ashima Arts for the
    // ideas for permutation and gradient selection.
    //
    // Copyright (c) 2011 Stefan Gustavson. All rights reserved.
    // Distributed under the MIT license. See LICENSE file.
    // https://github.com/ashima/webgl-noise
    //
    
    vec3 mod289(vec3 x)
    {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec4 mod289(vec4 x)
    {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec4 permute(vec4 x)
    {
      return mod289(((x*34.0)+1.0)*x);
    }
    
    vec4 taylorInvSqrt(vec4 r)
    {
      return 1.79284291400159 - 0.85373472095314 * r;
    }
    
    vec3 fade(vec3 t) {
      return t*t*t*(t*(t*6.0-15.0)+10.0);
    }
    
    // Classic Perlin noise
    float cnoise(vec3 P)
    {
      vec3 Pi0 = floor(P); // Integer part for indexing
      vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
      Pi0 = mod289(Pi0);
      Pi1 = mod289(Pi1);
      vec3 Pf0 = fract(P); // Fractional part for interpolation
      vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
      vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
      vec4 iy = vec4(Pi0.yy, Pi1.yy);
      vec4 iz0 = Pi0.zzzz;
      vec4 iz1 = Pi1.zzzz;
    
      vec4 ixy = permute(permute(ix) + iy);
      vec4 ixy0 = permute(ixy + iz0);
      vec4 ixy1 = permute(ixy + iz1);
    
      vec4 gx0 = ixy0 * (1.0 / 7.0);
      vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
      gx0 = fract(gx0);
      vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
      vec4 sz0 = step(gz0, vec4(0.0));
      gx0 -= sz0 * (step(0.0, gx0) - 0.5);
      gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    
      vec4 gx1 = ixy1 * (1.0 / 7.0);
      vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
      gx1 = fract(gx1);
      vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
      vec4 sz1 = step(gz1, vec4(0.0));
      gx1 -= sz1 * (step(0.0, gx1) - 0.5);
      gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    
      vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
      vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
      vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
      vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
      vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
      vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
      vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
      vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
    
      vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
      g000 *= norm0.x;
      g010 *= norm0.y;
      g100 *= norm0.z;
      g110 *= norm0.w;
      vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
      g001 *= norm1.x;
      g011 *= norm1.y;
      g101 *= norm1.z;
      g111 *= norm1.w;
    
      float n000 = dot(g000, Pf0);
      float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
      float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
      float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
      float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
      float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
      float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
      float n111 = dot(g111, Pf1);
    
      vec3 fade_xyz = fade(Pf0);
      vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
      vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
      float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
      return 2.2 * n_xyz;
    }
    
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normal;
      
      // Calculate noise based on position and time with higher frequency for more detail
      float noise = cnoise(position * 0.8 + time * speed * 0.1);
      
      // Apply distortion based on noise with enhanced hover effect
      float hoverPulse = hovered * sin(time * 3.0) * 0.2;
      vec3 newPosition = position + normal * (noise * distort * (1.0 + hovered * 0.8 + hoverPulse));
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  // Fragment shader with adjusted lighting for more definition
  `
  uniform float time;
  uniform vec3 yellowColor;
  uniform vec3 greenColor;
  uniform float hovered;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    // Create gradient based on position
    float gradientFactor = vPosition.y * 0.5 + 0.5; // Map from -1,1 to 0,1
    
    // Base blue colors
    vec3 baseColor = mix(yellowColor, greenColor, gradientFactor);
    
    // When hovered, shift to a deeper, more saturated blue
    vec3 hoveredColor = mix(vec3(0.0, 0.5, 1.0), vec3(0.0, 0.2, 0.7), gradientFactor);
    
    // Final color
    vec3 color = mix(baseColor, hoveredColor, hovered);
    
    // Add subtle rim lighting
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float rimFactor = 1.0 - max(0.0, dot(viewDirection, vNormal));
    rimFactor = pow(rimFactor, 3.0) * 0.5;
    
    // Add blue-tinted rim highlights
    vec3 rimColor = mix(vec3(0.2, 0.5, 1.0), vec3(0.0, 0.3, 0.8), gradientFactor);
    color += rimFactor * rimColor * (0.3 + hovered * 0.3);
    
    // Maintain consistent opacity
    float alpha = 0.9;
    
    gl_FragColor = vec4(color, alpha);
  }
  `,
)

// Extend Three.js with our custom material
extend({ GradientMaterial })

// Create an interactive 3D blob that reacts to hover
function InteractiveBlob({ mousePosition }) {
  const meshRef = useRef()
  const materialRef = useRef()
  const [hovered, setHovered] = React.useState(false)
  const { viewport } = useThree()

  // Track mouse position in 3D space
  const mouse3D = useRef(new THREE.Vector3())

  useFrame((state) => {
    if (meshRef.current) {
      // Base rotation
      meshRef.current.rotation.y += 0.003

      // Update mouse position in 3D space
      if (mousePosition.current) {
        mouse3D.current.set(
          (mousePosition.current.x * viewport.width) / 2,
          (mousePosition.current.y * viewport.height) / 2,
          0,
        )
      }

      // Update material uniforms
      if (materialRef.current) {
        materialRef.current.time += state.clock.getDelta()
        materialRef.current.hovered = THREE.MathUtils.lerp(materialRef.current.hovered, hovered ? 1.0 : 0.0, 0.15)
        materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, hovered ? 0.6 : 0.3, 0.1)
        materialRef.current.speed = THREE.MathUtils.lerp(materialRef.current.speed, hovered ? 3.0 : 1.2, 0.1)

        // Update colors to blue gradation
        materialRef.current.yellowColor = new THREE.Color("#0066ff")
        materialRef.current.greenColor = new THREE.Color("#003399")
      }
    }
  })

  return (
    <mesh ref={meshRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} renderOrder={1}>
      <sphereGeometry args={[2, 64, 64]} />
      <gradientMaterial ref={materialRef} transparent />
    </mesh>
  )
}

export default function InteractiveBlobSection() {
  const mousePosition = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event) => {
      // Calculate normalized mouse position (-1 to 1)
      mousePosition.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: "linear-gradient(0deg, #fff 0, #f0f8ff 30%, #f0f8ff 100%)" }}
    >
      {/* Logo and Menu */}
      <div className="absolute left-0 top-0 z-10 flex w-full items-center justify-between p-8">
        <div className="flex items-center gap-2">
          <div className="h-12 w-12 rounded bg-gradient-to-br from-[#4a9eff] to-[#0046b8]"></div>
          <span className="text-2xl font-bold text-[#333333]">CORNER</span>
        </div>
        <button className="text-[#333333]">
          <Menu size={32} />
        </button>
      </div>

      {/* 3D Blob */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <InteractiveBlob mousePosition={mousePosition} />
          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        </Canvas>
      </div>

      {/* Japanese Text */}
      <div className="absolute bottom-20 right-8 z-10 md:right-20">
        <JapaneseHeading />
      </div>
    </div>
  )
}
