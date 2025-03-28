import { useEffect, useState, useRef, useContext } from "react";

export default function Overlays(props) {
  const title_1Ref = useRef(null);
  const title_2Ref = useRef(null);
  const title_3Ref = useRef(null);

  useEffect(() => {
    title_1Ref.current.classList.add("animate_title_1");
    title_2Ref.current.classList.add("animate_title_2");
    title_3Ref.current.classList.add("animate_title_3");
  }, []);
  return (
    <div className="overlays">
      <div className="title">
        <div ref={title_1Ref} className="title_1"></div>
        {/* 205 */}
        <div className="title_container">
          <p ref={title_2Ref} className="title_2">
            India's First Consumer Grade
          </p>
          <p ref={title_3Ref} className="title_3">
            Upcoming VR Headset !!
          </p>
        </div>
      </div>
      <div className="metavian">
        {/* <div className="metavian_logo"></div> */}
        <div className="powered_by_metavian">
          <p>Powered by</p>
        </div>
        <div className="metavian_logo"></div>
      </div>
    </div>
  );
}
