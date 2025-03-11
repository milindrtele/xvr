import React, { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";

function DOMObject({ dom }) {
  const { scene } = useThree();
  const ref = useRef(null);

  useEffect(() => {
    if (dom.current) {
      ref.current = new CSS3DObject(dom.current);
      ref.current.position.set(0, 1, 0); // Adjust position
      scene.add(ref.current);
    }
    return () => {
      if (ref.current) scene.remove(ref.current);
    };
  }, [dom, scene]);

  return null;
}

export default function World() {
  const ref = useRef(null);

  return (
    <>
      <div ref={ref} className="hotspot">
        Hello World
      </div>
      <DOMObject dom={ref} />
    </>
  );
}
