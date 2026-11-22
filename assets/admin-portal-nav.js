/* Navigation is UI-only. The parent #dashboard remains hidden until the existing Firebase Admin check succeeds. */
(function () {
  "use strict";
  const allowed = new Set(["home","td","orientation"]);
  const viewIds={home:"portalHome",td:"portalTD",orientation:"portalOrientation"};
  function route() {
    const requested=decodeURIComponent(location.hash.slice(1)).toLowerCase();
    const active=allowed.has(requested)?requested:"home";
    for(const [key,id] of Object.entries(viewIds)){
      const pane=document.getElementById(id);
      if(pane)pane.classList.toggle("hidden",key!==active);
    }
    document.querySelectorAll("[data-portal-target]").forEach(link=>{
      if(link.dataset.portalTarget===active)link.setAttribute("aria-current","page");
      else link.removeAttribute("aria-current");
    });
    document.title=(active==="home"?"Admin Home":active==="td"?"TD Academy Admin":"Orientation Admin")+" | Learning & Development";
  }
  addEventListener("hashchange",route);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",route,{once:true});
  else route();
})();
