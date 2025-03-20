import { useEffect, useState, useRef, useContext } from "react";

export default function Overlays(props) {
  return (
    <div className="overlays">
      <div className="title">
        <p className="title_1">XVR 205</p>
        <p className="title_2">Upcoming Headset</p>
        <p className="title_3">India's First Consumer Grade VR Headset</p>
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
