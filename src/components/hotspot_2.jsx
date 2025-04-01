import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import gsap from "gsap";

export default function Hotspot(props) {
  const { camera } = useThree();
  const cameraRef = useRef(camera);
  const css2dObjectRef = useRef(null);

  const [svg_element, setSvg_element] = useState(null);
  const [svg_path, setSvg_path] = useState(null);

  const css2dObjectReadyRef = useRef(false);

  useEffect(() => {
    if (!css2dObjectReadyRef.current) {
      const container_div = document.createElement("div");
      container_div.style.width = "100dvw";
      container_div.style.height = "100dvh";
      container_div.style.pointerEvents = "none";
      container_div.style.position = "fixed";
      container_div.style.zIndex = 0;

      fetch("/innerHtml/hotspot.html")
        .then((response) => response.text())
        .then((data) => {
          const child = document.createElement("div");
          child.style.width = "max-content";
          child.style.height = "max-content";
          child.style.pointerEvents = "none";

          child.innerHTML = String(data);
          container_div.appendChild(child);

          css2dObjectRef.current = new CSS2DObject(container_div);
          css2dObjectRef.current.center.set(0, 0);
          css2dObjectRef.current.rotation.set(0, (Math.PI / 180) * 214.48, 0);
          css2dObjectRef.current.scale.set(0.1, 0.1, 0.1);
          css2dObjectRef.current.visible = false;

          setSvg_element(container_div.querySelector("#Layer_1"));
          setSvg_path(container_div.querySelector("#path"));

          const hotspot_datails =
            container_div.querySelector("#hotspot_datails");
          hotspot_datails.innerHTML = props.details;

          props.css2DScene.add(css2dObjectRef.current);
          css2dObjectReadyRef.current = true;
        })
        .catch((error) => console.error("Error loading HTML content:", error));
    }
  }, [props.details, props.css2DScene]);

  const drawLine = useCallback((line, value) => {
    if (!line) return;
    const pathLength = line.getTotalLength();
    const length = value * pathLength;
    line.style.strokeDasharray = [length, pathLength].join(" ");
  }, []);

  const animate_line = useCallback(() => {
    if (svg_path) {
      drawLine(svg_path, 0);
      gsap.to(
        { pos: 0 },
        {
          pos: 1,
          duration: 1,
          onUpdate: function () {
            drawLine(svg_path, this.targets()[0].pos);
          },
        }
      );
    }
  }, [svg_path, drawLine]);

  useEffect(() => {
    if (css2dObjectRef.current) {
      if (props.currentHoveredPart?.name === props.name) {
        const hotspot = props.allPartsPositionsRef.find(
          (h) => h.name === props.name
        );
        css2dObjectRef.current.position.set(
          hotspot.position.x,
          hotspot.position.y,
          hotspot.position.z
        );
        css2dObjectRef.current.visible = true;
        animate_line();
      } else {
        css2dObjectRef.current.visible = false;
      }
    }
  }, [
    props.currentHoveredPart,
    props.name,
    props.allPartsPositionsRef,
    animate_line,
  ]);

  useEffect(() => {
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
    }
  }, [props.parentObject]);

  return null;
}
