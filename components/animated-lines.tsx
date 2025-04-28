"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export default function AnimatedLines() {
  const lineCount = 3 // Reduced for better performance
  const lineGeometries = useMemo(() => {
    return Array(lineCount)
      .fill()
      .map(() => new THREE.BufferGeometry())
  }, [])

  const lineColors = useMemo(() => ["#4a9eff", "#00ccff", "#80e5ff"], [])

  const time = useRef(0)

  // Generate points for a curved line that goes over the top of the blob
  const generateCurvePoints = (index, t) => {
    const points = []
    const segments = 30 // Reduced for better performance
    const blobRadius = 2 // Blob radius

    // Distribute lines evenly around the blob
    const angle = (index / lineCount) * Math.PI * 2
    const startX = Math.cos(angle) * 3
    const startY = Math.sin(angle) * 3
    const endX = -startX
    const endY = -startY

    // Create a path that goes from one side of the blob to the other, over the top
    for (let i = 0; i <= segments; i++) {
      const progress = i / segments

      // Interpolate from start to end position
      const x = THREE.MathUtils.lerp(startX, endX, progress)
      const y = THREE.MathUtils.lerp(startY, endY, progress)

      // Calculate distance from center
      const distanceFromCenter = Math.sqrt(x * x + y * y)

      // Calculate height above the blob (z coordinate)
      let z = 0

      if (distanceFromCenter < blobRadius * 1.5) {
        // When over the blob, create an arc that follows the surface
        const normalizedDistance = distanceFromCenter / (blobRadius * 1.5)
        const arcHeight = Math.sin(normalizedDistance * Math.PI) * 2
        z = blobRadius + arcHeight
      } else {
        // When away from the blob, gradually descend
        z = 0
      }

      // Add rotation to make the lines move around the blob
      const rotationOffset = t * 0.1 // Slow rotation over time
      const rotatedX = x * Math.cos(rotationOffset) - y * Math.sin(rotationOffset)
      const rotatedY = x * Math.sin(rotationOffset) + y * Math.cos(rotationOffset)

      points.push(new THREE.Vector3(rotatedX, rotatedY, z))
    }

    return points
  }

  useFrame((state) => {
    // Update time reference
    time.current = state.clock.elapsedTime

    // Update each line
    for (let i = 0; i < lineCount; i++) {
      // Generate new curve points with time offset for each line
      const points = generateCurvePoints(i, time.current + i * 2)

      // Update the line geometry
      const curve = new THREE.CatmullRomCurve3(points)
      const positions = new Float32Array(curve.getPoints(30).flatMap((p) => [p.x, p.y, p.z]))

      lineGeometries[i].setAttribute("position", new THREE.BufferAttribute(positions, 3))
    }
  })

  return (
    <group renderOrder={10}>
      {lineGeometries.map((geometry, i) => (
        <line key={i} renderOrder={10}>
          <bufferGeometry attach="geometry" {...geometry} />
          <lineBasicMaterial color={lineColors[i]} linewidth={2} transparent opacity={0.8} depthTest={true} />
        </line>
      ))}
    </group>
  )
}
