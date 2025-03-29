import { createRoot } from "react-dom/client";
import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "./styles.css";

import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";

import Loading from "./components/loading_screen.jsx";
import Overlays from "./components/overlays.jsx";
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
import { ScrollToPlugin } from "gsap/dist/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

function XVRModel(props) {
  const group = useRef();
  const { camera } = useThree();
  const { scene, animations } = useGLTF(
    //"https://fashionix.sirv.com/xvr/models/VR%20Prototype%20Baked%20with%20anchors_3.glb"
    "/models/VR Prototype Baked with anchors_3.glb"
  );
  const { ref, actions, names, mixer } = useAnimations(animations, group);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const parentObjectRef = useRef(null);

  const prevHovered = useRef(null);
  const currentHovered = useRef(null);
  const currentPartsPositionRef = useRef([]);
  const isTouchDeviceRef = useRef(null);
  const scrollTriggerRef = useRef(null);
  const previousTimeRef = useRef(performance.now());
  const fpsRef = useRef(0);
  const avgFpsRef = useRef(0);
  const isgraphicsLevelsetRef = useRef(false);
  //const allPartsPositionsRef = [];

  function animateToProgress(targetProgress) {
    return new Promise((resolve, reject) => {
      // Get the total scrollable distance
      const totalScroll = 1000; //ScrollTrigger.maxScroll(window);

      // Calculate the scroll position based on the target progress
      const targetScroll = totalScroll * targetProgress;

      // Use gsap to animate the scroll position smoothly
      gsap.to(window, {
        scrollTo: targetScroll,
        //duration: 3, // Adjust the duration for smoothness
        //ease: "power2.inOut", // You can change the easing for different effects
        onUpdate: () => {
          if (scrollTriggerRef.current != null) {
            scrollTriggerRef.current.refresh(); // Refresh ScrollTrigger on update to ensure correct behavior
          }
        },
        onComplete: () => {
          resolve();
        },
      });
    });
  }

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
      props.allPartsPositionsRef.push({ name: name, position: { ...newPos } });
    }

    // const hotspot = props.allPartsPositionsRef.find(
    //   (h) => h.name === "cumpute_components"
    // );
    //if (hotspot) console.log(hotspot.position);
  }

  useEffect(() => {
    scene.traverse((child) => {
      if (child.name == "parent") {
        parentObjectRef.current = child;
        props.setParentObject(parentObjectRef.current);
      }
      if (child.name == "dome") {
        child.material.side = THREE.FrontSide;
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

      scrollTriggerRef.current = ScrollTrigger.create({
        trigger: "#canvas_container",
        start: "top",
        end: "1000",
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

  useEffect(() => {
    if (scene) {
      props.setLoadingState();
    }
  }, [scene]);

  useEffect(() => {
    isTouchDeviceRef.current = props.isTouchDevice;
  }, [props.isTouchDevice]);

  useEffect(() => {
    animateToProgress(props.sliderProgress / 100);
  }, [props.sliderProgress]);

  useEffect(() => {
    props.cameraRef.current = camera; // Store the reference
  }, [camera, props]);

  let frameNo = 0;
  let fpsArray = [];
  let totalfps = 0;
  let totalFramesToConsider = 30;
  useFrame(() => {
    if (props.css2DRendererRef && props.css2DSceneRef && camera) {
      props.css2DRendererRef.render(props.css2DSceneRef, camera);
    }
    if (!isgraphicsLevelsetRef.current) {
      if (frameNo < totalFramesToConsider) {
        frameNo++;
      } else {
        frameNo = 0;
      }
      if (!previousTimeRef.current) {
        previousTimeRef.current = performance.now();
      }
      // Calculate FPS
      const currentTime = performance.now();
      const deltaTime = (currentTime - previousTimeRef.current) / 1000; // Convert ms to seconds
      previousTimeRef.current = currentTime;

      if (deltaTime > 0) {
        fpsRef.current = Math.round(1 / deltaTime);
        if (fpsArray.length < totalFramesToConsider) {
          fpsArray.push(fpsRef.current);
        }
      }

      if (fpsArray.length == totalFramesToConsider) {
        totalfps = 0;
        fpsArray.forEach((fpsNo) => {
          totalfps = totalfps + fpsNo;
        });
        avgFpsRef.current = totalfps / totalFramesToConsider;
        if (avgFpsRef.current <= 30) {
          props.enableGroundReflectorRef(false);
          isgraphicsLevelsetRef.current = true;
        } else {
          props.enableGroundReflectorRef(true);
          isgraphicsLevelsetRef.current = true;
        }
        fpsArray.length = 0;
      }
    }
  });

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
        hoveredObject.material.emissive.set(0x696868); // color
        prevHovered.current = hoveredObject;
      }
    }
  };

  const handlePointerOut = () => {
    if (prevHovered.current)
      prevHovered.current.material.emissive.set(0x000000);
  };

  return (
    <>
      <primitive
        object={scene}
        ref={ref}
        {...(isTouchDeviceRef.current
          ? {
              onPointerDown: handlePointerOver,
              onPointerUp: handlePointerOut,
            }
          : {
              onPointerOver: handlePointerOver,
              onPointerOut: handlePointerOut,
            })}
      />
    </>
  );
}

function AdaptivePixelRatio() {
  const current = useThree((state) => state.performance.current);
  const setPixelRatio = useThree((state) => state.setDpr);
  useEffect(() => {
    setPixelRatio((window.devicePixelRatio * current) / 20);
    console.log(current);
  }, [current, setPixelRatio]);
  return null;
}

function ResizeHandler(props) {
  const { gl, camera, setSize } = useThree();

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      gl.setSize(window.innerWidth, window.innerHeight);
      gl.setPixelRatio(window.devicePixelRatio / 2);

      if (props.css2DRendererRef?.current) {
        props.css2DRendererRef.current.setSize(
          window.innerWidth,
          window.innerHeight
        );
        // if (props.isTouchDevice) {
        //   props.css2DRendererRef.current.setSize(
        //     window.innerWidth / 4,
        //     window.innerHeight / 4
        //   );
        // } else {
        //   props.css2DRendererRef.current.setSize(
        //     window.innerWidth,
        //     window.innerHeight
        //   );
        // }

        props.css2DRendererRef.current.domElement.style.top = "0";
        props.css2DRendererRef.current.domElement.style.left = "0";
        props.css2DRendererRef.current.domElement.style.width = "100dvw";
        props.css2DRendererRef.current.domElement.style.height = "100dvh";
        // props.css2DRendererRef.current.domElement.style.borderStyle = "solid";
        // props.css2DRendererRef.current.domElement.style.borderWidth = "3px";
        // props.css2DRendererRef.current.domElement.style.borderColor = "red";
        // props.css2DRendererRef.current.domElement.style.backgroundColor =
        //   "rgba(245, 0, 0, 0.26)";
        // //props.css2DRendererRef.current.setPixelRatio(window.devicePixelRatio);
        // console.log(window.devicePixelRatio);
        // console.log(props.css2DRendererRef.current.domElement.style.width);
        // console.log(props.css2DRendererRef.current.domElement.style.height);
        // props.css2DRendererRef.current.domElement.style.transform = `scale(${
        //   window.devicePixelRatio / 2
        // })`;
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [gl, camera, setSize, props.css2DRendererRef]);

  return null;
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
  const [loading, setLoading] = useState(true);
  const isTouchDeviceRef = useRef(false);
  const [sliderProgress, setSliderProgress] = useState(0);
  const [orientation, setOrientation] = useState("landscape");
  const cameraRef = useRef(null);
  const enableGroundReflectorRef = useRef(false);
  const [enableGroundReflector, setEnableGroundReflector] = useState(true);
  const [hotspotDetailsState, setHotspotDetailsState] = useState(null);

  //2D renderer
  const css2dRendererRef = useRef(null);

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

  useEffect(() => {
    setHotspotDetailsState(hotspotDetails);
    currentPartsPositionRef.current = hotspotDetails;
  }, []);

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

  useEffect(() => {
    if ("ontouchstart" in document.documentElement) {
      isTouchDeviceRef.current = true;
    } else {
      isTouchDeviceRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (window.innerWidth <= window.innerHeight) {
      setOrientation("portrait");
    } else {
      setOrientation("landscape");
    }
  }, []);

  useEffect(() => {
    css2dRendererRef.current = new CSS2DRenderer();
    css2dRendererRef.current.setSize(window.innerWidth, window.innerHeight);
    css2dRendererRef.current.domElement.style.position = "fixed";
    css2dRendererRef.current.domElement.style.top = "0";
    css2dRendererRef.current.domElement.style.pointerEvents = "none";
    document.body.appendChild(css2dRendererRef.current.domElement);

    //addToScene();

    return () => {
      document.body.removeChild(css2dRendererRef.current.domElement);
    };
  }, []);

  const setCurrentHoveredObject = (object) => {
    setCurrentHovered(object);
  };

  const setParentObject = (object) => {
    parentObjectRef.current = object;
  };

  const setLoadingState = () => {
    setLoading(false);
  };

  const enableGroundReflectorF = (value) => {
    setEnableGroundReflector(value);
  };

  return (
    <>
      <Canvas
        // pixelRatio={0.1}
        resize={{ scroll: true, debounce: { scroll: 50, resize: 0 } }}
        dpr={isTouchDeviceRef.current ? 0.75 : 1}
        id="canvas_container"
        shadows={enableGroundReflector ? true : false}
        className="canvas"
        camera={{
          position: [0.6, 0.3, 0.6],
          fov: orientation === "portrait" ? 50 : 35,
        }}
      >
        {/* <AdaptivePixelRatio />
        <ResizeHandler
          css2DRendererRef={css2dRendererRef}
          isTouchDevice={isTouchDeviceRef.current}
        /> */}
        <Environment
          files="/hdri/royal_esplanade_1k.hdr"
          //background
          // backgroundBlurriness={0.5}
        />
        {enableGroundReflector ? <SoftShadows {...config} /> : null}
        <ambientLight intensity={Math.PI / 2} />
        <directionalLight
          castShadow
          position={[-0.325, 0.55, 0.37]}
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
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
          cameraRef={cameraRef}
          css2DRendererRef={css2dRendererRef.current}
          css2DSceneRef={css2DSceneRef.current}
          setCurrentHoveredObject={setCurrentHoveredObject}
          setParentObject={setParentObject}
          allPartsPositionsRef={allPartsPositionsRef.current}
          setLoadingState={setLoadingState}
          isTouchDevice={isTouchDeviceRef.current}
          sliderProgress={sliderProgress}
          enableGroundReflectorRef={enableGroundReflectorF}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13, 0]}>
          <planeGeometry args={[100, 100]} />
          {enableGroundReflector ? (
            <MeshReflectorMaterial
              //
              blur={[400, 100]}
              resolution={isTouchDeviceRef.current ? 256 : 1024}
              mixBlur={1}
              mixStrength={15}
              depthScale={1}
              minDepthThreshold={0.1}
              depthToBlurRatioBias={1}
              distortion={1}
              //maxDepthThreshold={2}
              color="#6e6e6e" //#151515 //#2B2B2B
              metalness={0}
              roughness={1}
            />
          ) : (
            <meshStandardMaterial color="#ffffff" />
          )}
        </mesh>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.12, 0]}
          receiveShadow
        >
          <planeGeometry args={[30, 30]} />
          <shadowMaterial transparent opacity={0.4} />
        </mesh>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate={autoRotateState}
        />
        {/* <Stats /> */}
        {loading
          ? null
          : hotspotDetailsState.map((hotspot, index) => (
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
                css2dRenderer={css2dRendererRef.current}
                css2DScene={css2DSceneRef.current}
              />
            ))}
      </Canvas>

      {loading ? (
        <Loading />
      ) : (
        <>
          <Overlays />
          {isTouchDeviceRef.current ? (
            <div className="slidecontainer">
              <input
                type="range"
                min="1"
                max="100"
                value={sliderProgress}
                className="slider"
                id="myRange"
                onChange={(e) => {
                  setSliderProgress(e.target.value);
                }}
              ></input>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
