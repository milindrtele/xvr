import { createRoot } from "react-dom/client";
import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import "./styles.css";

import {
  useGLTF,
  useAnimations,
  OrbitControls,
  Environment,
  SoftShadows,
  Stats,
  MeshReflectorMaterial,
} from "@react-three/drei";
import { useControls } from "leva";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// function XVRModel(props) {
//   const group = useRef();
//   const { scene, animations } = useGLTF("/models/VRPrototypeBaked-v1.glb");
//   // Extract animation actions
//   console.log(animations);
//   const { ref, actions, names } = useAnimations(animations);

//   console.log(JSON.stringify(actions[names[0]]));
//   animations[0].play();

//   // const { scene } = useGLTF("/models/VRPrototypeBaked-v1.glb");
//   // const { actions, mixer } = useAnimations(animations, group);

//   scene.traverse((child) => {
//     if (child.isMesh) {
//       child.castShadow = true;
//       child.receiveShadow = true;
//     }
//   });

//   return <primitive object={scene} />;
// }

gsap.registerPlugin(ScrollTrigger);

function XVRModel(props) {
  const group = useRef();
  const { scene, animations } = useGLTF("/models/VRPrototypeBaked-v1.glb");
  const { ref, actions, names, mixer } = useAnimations(animations, group);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    if (actions[names[0]]) {
      const action = actions[names[0]];
      action.play(); // Play but keep it controlled via seek
      action.paused = true; // Prevent automatic playing

      // Link scroll progress to animation
      ScrollTrigger.create({
        trigger: "#canvas_container",
        start: "top",
        end: "1000px",
        pin: true,
        scrub: 1, // Smooth animation control
        markers: true,
        onUpdate: (self) => {
          const progress = self.progress; // Get scroll progress (0 to 1)
          action.time = action.getClip().duration * progress; // Map progress to animation time
        },
      });
    }
  }, [actions, names]);

  return <primitive object={scene} ref={ref} />;
}

// function Box(props) {
//   const meshRef = useRef();
//   const [hovered, setHover] = useState(false);
//   const [active, setActive] = useState(false);

//   useFrame((state, delta) => (meshRef.current.rotation.x += delta));

//   return (
//     <mesh
//       {...props}
//       ref={meshRef}
//       scale={active ? 1.5 : 1}
//       onClick={() => setActive(!active)}
//       onPointerOver={() => setHover(true)}
//       onPointerOut={() => setHover(false)}
//     >
//       <boxGeometry args={[1, 1, 1]} />
//       <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
//     </mesh>
//   );
// }

export default function App() {
  const { ...config } = useControls({
    size: { value: 15, min: 0, max: 50 },
    focus: { value: 0.5, min: 0, max: 2 },
    samples: { value: 6, min: 1, max: 10, step: 1 },
    // dark_material_color: { value: "#1cbcf2" },
    // light_material_color: { value: "#dbf6ff" },
    // thickness_map: true,
  });
  return (
    <Canvas
      id="canvas_container"
      shadows
      className="canvas"
      camera={{ position: [0.6, 0.3, 0.6], fov: 35 }}
    >
      <Environment
        files="/hdri/royal_esplanade_1k.hdr"
        // background
        // backgroundBlurriness={0.5}
      />
      <SoftShadows {...config} />
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight
        castShadow
        position={[-0.325, 0.55, 0.37]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-0.5}
        shadow-camera-right={0.5}
        shadow-camera-top={0.5}
        shadow-camera-bottom={-0.5}
      />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

      <XVRModel />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13, 0]}>
        <planeGeometry args={[100, 100]} />
        <MeshReflectorMaterial
          //
          blur={[400, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={15}
          depthScale={1}
          minDepthThreshold={0.1}
          depthToBlurRatioBias={1}
          distortion={1}
          //maxDepthThreshold={2}
          color="#949494" //#151515 //#2B2B2B
          metalness={0}
          roughness={1}
        />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.12, 0]}
        receiveShadow
      >
        <planeGeometry args={[30, 30]} />
        <shadowMaterial transparent opacity={0.4} />
      </mesh>

      <OrbitControls enableZoom={false} />
      <Stats />
    </Canvas>
  );
}

// Ensure that createRoot is only called once at the top level
createRoot(document.getElementById("root")).render(<App />);
