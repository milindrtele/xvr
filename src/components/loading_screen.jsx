import { useEffect, useState, useRef, useContext } from "react";
// import { loadingContext } from "../contexts/loadingContext.jsx";
// import styles from "./loading.module.css";

export default function Loading(props) {
  //   const { loadedPercentage, setLoadedPercentage } = useContext(loadingContext);
  //   const loading_barRef = useRef(null);
  //   useEffect(() => {
  //     loading_barRef.current.style.width = `${loadedPercentage}%`;
  //   }, [loadedPercentage]);
  return (
    <div className="abc">
      <div className="loading_screen">
        {/* <div className={[styles.loading_screen_background].join(" ")}></div> */}
        <div className="loading_screen_content">
          <div className="metavian_logo_art"></div>
          {/* <div className="loader_box">
            <div className="loader"></div>
          </div> */}
          {/* <div className={[styles.loading_bar_container].join(" ")}>
            <div
              ref={loading_barRef}
              className={[styles.loading_bar].join(" ")}
            ></div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
