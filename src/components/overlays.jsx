import { useEffect, useState, useRef, useContext } from "react";

export default function Overlays(props) {
  return (
    <div className="overlays">
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
