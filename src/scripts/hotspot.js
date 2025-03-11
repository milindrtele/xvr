import * as THREE from "three";
// import {
//   CSS3DRenderer,
//   CSS3DObject,
// } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";

class Hotspot {
  constructor(
    hotspotType,
    cssScene,
    position,
    distanceFormCam,
    childHtmlUrl,
    title,
    subTitle,
    videoID,
    webURL,
    mainCamera,
    productViewerCallback,
    productPageVisible
  ) {
    this.hotspotType = hotspotType;
    this.cssScene = cssScene;
    this.container_div = null;
    this.iframe = null;
    this.css2dObject = null;
    this.position = position;
    this.distanceFormCam = distanceFormCam;
    this.childHtmlUrl = childHtmlUrl;

    this.child = null;
    this.title = title;
    this.subTitle = subTitle;
    this.webURL = webURL || null;

    this.mainCamera = mainCamera;
    this.productViewerCallback = productViewerCallback;

    this.productPageVisible = productPageVisible;

    this.init();
  }

  init() {
    this.css2dObjectReady = new Promise((resolve, reject) => {
      this.container_div = document.createElement("div");
      this.container_div.style.width = "max-content";
      this.container_div.style.height = "max-content";
      this.container_div.style.pointerEvents = "none";
      this.container_div.style.position = "fixed";
      this.container_div.style.zIndex = 0;

      // Fetch HTML content from a separate file and add it to the child element
      fetch(this.childHtmlUrl)
        .then((response) => response.text())
        .then((data) => {
          this.child = document.createElement("div");
          this.child.style.width = "max-content";
          this.child.style.height = "max-content";
          this.child.style.background = "0xffffff00";
          this.child.style.pointerEvents = "none";

          this.child.innerHTML = String(data);
          this.container_div.appendChild(this.child);

          this.css2dObject = new CSS2DObject(this.container_div);
          this.css2dObject.position.set(
            this.position[0],
            this.position[1],
            this.position[2]
          );
          this.css2dObject.center.set(0, 0);
          this.css2dObject.rotation.set(0, (Math.PI / 180) * 214.48, 0);
          this.css2dObject.scale.set(0.1, 0.1, 0.1);

          this.setupInnerText(this.child);

          this.calculateDistance(this.mainCamera, this.css2dObject);
          this.addEventListnerToChild(this.child);

          resolve(); // Signal that the css2dObject is ready
        })
        .catch((error) => {
          console.error("Error loading HTML content:", error);
          reject(error);
        });
    });
  }

  setupInnerText(child) {
    const title = this.child.querySelector("#title");
    if (title) {
      title.textContent = this.title; // Change this to the desired text
    }
    const subTitle = this.child.querySelector("#sub_title");
    if (subTitle) {
      subTitle.textContent = this.subTitle; // Change this to the desired text
    }

    const hotspot = this.child.querySelector("#hotspot_container_parent");
    const hotspot_icon = this.child.querySelector("#hotspot_icon");
    const details_container = this.child.querySelector("#details_container");

    let mouseIn = false;
    hotspot.addEventListener("mouseenter", () => {
      mouseIn = true;
      hotspot.classList.add("active");
      hotspot_icon.classList.add("active3");
      details_container.classList.add("active2");
    });

    hotspot.addEventListener("mouseleave", () => {
      setTimeout(() => {
        if (mouseIn) {
          hotspot.classList.remove("active");
          hotspot_icon.classList.remove("active3");
          details_container.classList.remove("active2");
          mouseIn = false;
        }
      }, 100); // Wait for the longest animation duration
    });
  }

  addEventListnerToChild(child) {
    const action_button = child.querySelector("#action_button");
    action_button.addEventListener("click", () => {
      console.log("button clicked " + this.title);
      //if (this.productViewerCallback) this.productViewerCallback(this.title);
      window.open(this.webURL, "_blank");
    });
  }

  calculateDistance(camera, cssObject) {
    const checkDistance = () => {
      //console.log(this.productPageVisible + "  " + this.title);
      if (this.hotspotType == "primary") {
        if (!this.productPageVisible) {
          let distance = camera.position.distanceTo(cssObject.position);
          if (distance <= this.distanceFormCam) {
            this.css2dObject.visible = true;
            //this.cssScene.add(this.css2dObject);
          } else {
            this.css2dObject.visible = false;
            //this.cssScene.remove(this.css2dObject);
          }
        } else {
          this.css2dObject.visible = false;
        }
      } else if (this.hotspotType == "secondary") {
        let distanceToObject = camera.position.distanceTo(cssObject.position);
        let distanceToOrigin = camera.position.distanceTo(
          new THREE.Vector3(0, 0, 0)
        );
        if (distanceToObject <= distanceToOrigin) {
          this.css2dObject.visible = true;
          //this.cssScene.add(this.css2dObject);
        } else {
          this.css2dObject.visible = false;
          //this.cssScene.remove(this.css2dObject);
        }
      }
      requestAnimationFrame(checkDistance);
    };

    requestAnimationFrame(checkDistance);
  }

  async addToScene() {
    try {
      await this.css2dObjectReady; // Wait until css2dObject is created
      this.cssScene.add(this.css2dObject);
    } catch (error) {
      console.error("Failed to add to scene:", error);
    }
  }

  async removeFromScene() {
    await this.cssScene.remove(this.css2dObject);
  }

  async hideObject() {
    this.css2dObject.visible = false;
  }

  async showObject() {
    this.css2dObject.visible = true;
  }

  hideiFrame() {
    if (this.container_div) {
      this.container_div.style.display = "none";
    }
  }

  showiFrame() {
    if (this.container_div) {
      this.container_div.style.display = "block";
    }
  }
}

export default Hotspot;
