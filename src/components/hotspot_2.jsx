import React, { useRef, useEffect, useState, use } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import gsap from "gsap";
// import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
// gsap.registerPlugin(DrawSVGPlugin);

export default function Hotspot(props) {
  //const css2dRendererRef = useRef(null);
  const { camera } = useThree();
  //const css2DSceneRef = useRef(new THREE.Scene()); // Add scene reference
  const cameraRef = useRef(camera); // Add camera reference
  const css2dObjectRef = useRef(null);

  const [svg_element, setSvg_element] = useState(null);
  const [svg_path, setSvg_path] = useState(null);

  const css2dObjectReadyRef = useRef(null);
  const currentHoveredPart = useRef(props.currentHoveredPart);

  css2dObjectReadyRef.current = new Promise((resolve, reject) => {
    if (css2dObjectRef.current == null) {
      const container_div = document.createElement("div");
      container_div.style.width = "100dvw";
      container_div.style.height = "100dvh";
      container_div.style.pointerEvents = "none";
      container_div.style.position = "fixed";
      container_div.style.zIndex = 0;

      // Fetch HTML content from a separate file and add it to the child element
      fetch("/innerHtml/hotspot.html")
        .then((response) => response.text())
        .then((data) => {
          const child = document.createElement("div");
          child.style.width = "max-content";
          child.style.height = "max-content";
          child.style.background = "0xffffff00";
          child.style.pointerEvents = "none";

          child.innerHTML = String(data);
          container_div.appendChild(child);

          const position = [0.2, 0, 0];

          css2dObjectRef.current = new CSS2DObject(container_div);

          // css2dObjectRef.current.position.set(
          //   props.position[0],
          //   props.position[1],
          //   props.position[2]
          // );
          css2dObjectRef.current.center.set(0, 0);
          css2dObjectRef.current.rotation.set(0, (Math.PI / 180) * 214.48, 0);
          css2dObjectRef.current.scale.set(0.1, 0.1, 0.1);
          css2dObjectRef.current.visible = false;

          setSvg_element(container_div.querySelector("#Layer_1"));
          setSvg_path(container_div.querySelector("#path"));

          const hotspot_datails =
            container_div.querySelector("#hotspot_datails");
          hotspot_datails.innerHTML = props.details;

          resolve(); // Signal that the css2dObject is ready
        })
        .catch((error) => {
          console.error("Error loading HTML content:", error);
          reject(error);
        });
    }
  });

  async function addToScene() {
    try {
      await css2dObjectReadyRef.current; // Wait until css2dObject is created
      props.css2DScene.add(css2dObjectRef.current);
    } catch (error) {
      console.error("Failed to add to scene:", error);
    }
  }

  // useEffect(() => {
  //   css2dRendererRef.current = new CSS2DRenderer();
  //   css2dRendererRef.current.setSize(window.innerWidth, window.innerHeight);
  //   css2dRendererRef.current.domElement.style.position = "fixed";
  //   css2dRendererRef.current.domElement.style.top = "0";
  //   css2dRendererRef.current.domElement.style.pointerEvents = "none";
  //   document.body.appendChild(css2dRendererRef.current.domElement);

  //   //addToScene();

  //   return () => {
  //     document.body.removeChild(css2dRendererRef.current.domElement);
  //   };
  // }, []);

  let scrollObj1 = {
    pos: 0,
  };
  var length = 0; // Object to animate the scroll position
  var pathLength;

  // Draw the line
  function drawLine(line, value) {
    if (!line) return; // Ensure the line element exists before proceeding

    if (!pathLength || pathLength === 0) {
      pathLength = line.getTotalLength(); // Get path length only if not set
    }

    length = value * pathLength; // Scale length based on value (0 to 1)

    // Apply stroke properties
    if (!isNaN(length) && !isNaN(pathLength) && pathLength > 0) {
      //line.style.strokeDasharray = pathLength; // Full path length
      //line.style.strokeDashoffset = pathLength - length; // Animate drawing
      line.style.strokeDasharray = [length, pathLength].join(" ");
    } else {
      console.warn("Invalid path length:", length, pathLength);
    }
  }

  function animate_line() {
    if (svg_path) {
      //console.log("animating");
      // Ensure the path is hidden initially
      drawLine(svg_path, 0);

      scrollObj1.pos = 0;
      gsap.to(scrollObj1, {
        pos: 1,
        duration: 1,
        onUpdate: () => {
          drawLine(svg_path, scrollObj1.pos);
        },
      });
    }
  }

  useEffect(() => {
    //console.log("entered useEffect");
    css2dObjectReadyRef.current
      .then(() => {
        //console.log("2dObject ready");
        props.css2DScene.add(css2dObjectRef.current);
        //animate_line(); // This runs once when the component mounts
      })
      .catch((err) => console.error("Error loading hotspot:", err));
  }, []);

  useEffect(() => {
    if (css2dObjectRef.current) {
      if (
        props.currentHoveredPart &&
        props.currentHoveredPart.name == props.name
      ) {
        const hotspot = props.allPartsPositionsRef.find(
          (h) => h.name === props.name
        );

        css2dObjectRef.current.position.set(
          hotspot.position.x,
          hotspot.position.y,
          hotspot.position.z
        );
        css2dObjectRef.current.visible = true;
        // css2dObjectRef.current.element.style.display = "block";
        console.log("visible hotspot " + props.name);
        // console.log(css2dObjectRef.current);
        animate_line();
      } else {
        css2dObjectRef.current.visible = false;
        //css2dObjectRef.current.element.style.display = "none";
      }
    }

    // console.log(props.name);
    // console.log(hotspot.position);
  }, [
    props.currentHoveredPart,
    animate_line,
    props.name,
    props.allPartsPositionsRef,
  ]);

  useEffect(() => {
    //console.log("entered useeffect");
    if (props.parentObject) {
      const positionalEmpty = props.parentObject.getObjectByName(
        props.name + "_empty"
      );
      if (css2dObjectRef.current)
        css2dObjectRef.current.position.set(
          positionalEmpty.position.x,
          positionalEmpty.position.y,
          positionalEmpty.position.z
        );
      //console.log(props.name, positionalEmpty.position);
    }
  }, [props.parentObject]);

  // useEffect(() => {
  //   const handleResize = () => {
  //     if (props.css2dRenderer) {
  //       props.css2dRenderer.setSize(window.innerWidth, window.innerHeight);
  //     }
  //   };

  //   window.addEventListener("resize", handleResize);

  //   return () => {
  //     window.removeEventListener("resize", handleResize);
  //   };
  // }, []);

  // useFrame(() => {
  //   if (props.css2dRenderer && props.css2DScene && cameraRef.current) {
  //     props.css2dRenderer.render(props.css2DScene, cameraRef.current);
  //   }
  // });

  return <></>;
}
