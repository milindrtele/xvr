import { createRoot } from "react-dom/client";
import React, { useRef, useState, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "./styles.css";

import Hotspot from "./components/hotspot_2.jsx";

import {
  useGLTF,
  useAnimations,
  OrbitControls,
  Environment,
  SoftShadows,
  Stats,
  MeshReflectorMaterial,
} from "@react-three/drei";
//import { useControls } from "leva";
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
  const { camera } = useThree();
  const { scene, animations } = useGLTF(
    "/models/VR Prototype Baked with anchors_2.glb"
  );
  const { ref, actions, names, mixer } = useAnimations(animations, group);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const parentObjectRef = useRef(null);

  const prevHovered = useRef(null);
  const currentHovered = useRef(null);
  const currentPartsPositionRef = useRef([]);
  //const allPartsPositionsRef = [];

  function updateHotspotPosition(name, newPos) {
    const foundIndex = props.allPartsPositionsRef.findIndex(
      (h) => h.name === name
    );

    if (foundIndex !== -1) {
      // Updating existing hotspot
      props.allPartsPositionsRef[foundIndex] = {
        ...props.allPartsPositionsRef[foundIndex],
        position: { ...newPos }, // Ensure immutability
      };
    } else {
      // Adding a new hotspot
      console.log("Hotspot not found! Adding new hotspot.");
      props.allPartsPositionsRef.push({ name: name, position: { ...newPos } });
    }

    const hotspot = props.allPartsPositionsRef.find(
      (h) => h.name === "cumpute_components"
    );
    //if (hotspot) console.log(hotspot.position);
  }

  useEffect(() => {
    scene.traverse((child) => {
      if (child.name == "parent") {
        parentObjectRef.current = child;
        props.setParentObject(parentObjectRef.current);
      }
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    if (actions[names[0]]) {
      const action = actions[names[0]];
      action.play();
      action.paused = true;

      ScrollTrigger.create({
        trigger: "#canvas_container",
        start: "top",
        end: "1000px",
        pin: true,
        scrub: 1,
        // markers: true,
        onUpdate: (self) => {
          props.setCurrentHoveredObject(null);
          const progress = self.progress;
          action.time = action.getClip().duration * progress;

          //updated positions of the parts on scroll update
          parentObjectRef.current.children.forEach((part) => {
            if (part.isMesh) {
              const positions = {
                x: part.position.x,
                y: part.position.y,
                z: part.position.z,
              };

              updateHotspotPosition(part.name, positions);
            }
          });
        },
      });
    }
  }, [actions, names]);

  const handlePointerOver = (event) => {
    event.stopPropagation();

    // Convert pointer position to normalized device coordinates
    mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Perform raycasting
    raycaster.current.setFromCamera(mouse.current, camera);
    const intersects = raycaster.current.intersectObject(
      parentObjectRef.current,
      true
    );

    // Reset the previous hovered object's emissive color if it exists and is different from the new one
    if (prevHovered.current && prevHovered.current !== intersects[0]?.object) {
      if (
        prevHovered.current.material &&
        prevHovered.current.material.emissive
      ) {
        prevHovered.current.material.emissive.set(0x000000);
      }
      prevHovered.current = null;
    }

    if (intersects.length > 0) {
      const hoveredObject = intersects[0].object;
      props.setCurrentHoveredObject(hoveredObject);

      if (hoveredObject.material && hoveredObject.material.emissive) {
        hoveredObject.material.emissive.set(0x0000ff); // Blue color
        prevHovered.current = hoveredObject;
      }
    }
  };

  const handlePointerOut = () => {
    if (prevHovered.current)
      prevHovered.current.material.emissive.set(0x000000);
  };

  return (
    <primitive
      object={scene}
      ref={ref}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
}

export default function App() {
  // const { ...config } = useControls({
  //   size: { value: 15, min: 0, max: 50 },
  //   focus: { value: 0.5, min: 0, max: 2 },
  //   samples: { value: 6, min: 1, max: 10, step: 1 },
  //   // dark_material_color: { value: "#1cbcf2" },
  //   // light_material_color: { value: "#dbf6ff" },
  //   // thickness_map: true,
  // });

  const [clicked, setClicked] = useState(false);
  const autoRotateRef = useRef(true);
  const [autoRotateState, setAutoRotateState] = useState(true);
  const css2DSceneRef = useRef(new THREE.Scene()); // Add scene reference
  const [currentHovered, setCurrentHovered] = useState(null);
  const parentObjectRef = useRef(null);
  const currentPartsPositionRef = useRef([]);
  const allPartsPositionsRef = useRef([]);

  const timeOutRef = useRef(null);

  const config = { size: 12.5, focus: 0.0, samples: 10 };

  const hotspotDetails = [
    {
      name: "frontal_screen",
      details: "Front Glass",
      pos: { x: 0.065203, y: -0.012599, z: 0.455502 },
    },
    {
      name: "cumpute_components",
      details: "Compute Core",
      pos: { x: 0.04, y: -0.015138, z: 0.393335 },
    },
    {
      name: "lenses",
      details: "Lenses",
      pos: { x: 0.04, y: -0.021696, z: 0.345634 },
    },
    {
      name: "body",
      details: "Body",
      pos: { x: 0.082205, y: -0.021696, z: 0.289858 },
    },
    {
      name: "fabric",
      details: "Head Cousion",
      pos: { x: 0.07398, y: -0.021696, z: -0.093429 },
    },
    {
      name: "battery",
      details: "Battery",
      pos: { x: 0.066513, y: -0.021696, z: -0.265673 },
    },
  ];

  currentPartsPositionRef.current = hotspotDetails;

  function bindEventsToSameHandler(element, events, handler) {
    for (var i = 0; i < events.length; i++) {
      element.addEventListener(events[i], handler);
    }
  }

  function handler() {
    setClicked((clicked) => !clicked);
    setAutoRotateState(false);
    clearTimeout(timeOutRef.current);
    timeOutRef.current = setTimeout(() => {
      setAutoRotateState(true);
    }, 6000);
  }

  useEffect(() => {
    const element = document.getElementById("canvas_container");
    if (!element) return; // Ensure element exists

    const events = ["click", "scroll"];
    bindEventsToSameHandler(element, events, handler);

    return () => {
      events.forEach((event) => element.removeEventListener(event, handler));
    };
  }, []);

  const setCurrentHoveredObject = (object) => {
    setCurrentHovered(object);
  };

  const setParentObject = (object) => {
    parentObjectRef.current = object;
  };

  return (
    <>
      <Canvas
        id="canvas_container"
        shadows
        className="canvas"
        camera={{ position: [0.6, 0.3, 0.6], fov: 35 }}
      >
        <Environment
          files="/hdri/royal_esplanade_1k.hdr"
          //background
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

        <XVRModel
          setCurrentHoveredObject={setCurrentHoveredObject}
          setParentObject={setParentObject}
          allPartsPositionsRef={allPartsPositionsRef.current}
        />
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

        <OrbitControls enableZoom={false} autoRotate={autoRotateState} />
        <Stats />
        {hotspotDetails.map((hotspot, index) => (
          <Hotspot
            key={index}
            className="hotspot_container"
            clicked={clicked}
            position={[hotspot.pos.x, hotspot.pos.y, hotspot.pos.z]}
            name={hotspot.name}
            details={hotspot.details}
            currentHoveredPart={currentHovered}
            parentObject={parentObjectRef.current}
            allPartsPositionsRef={allPartsPositionsRef.current}
          />
        ))}
      </Canvas>
    </>
  );
}
