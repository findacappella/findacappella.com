(function () {
  function currentPath() {
    var p = (location.pathname.split("/").pop() || "").trim();
    if (!p || p === "/") return "index.html";
    if (!p.endsWith(".html")) p += ".html";
    return p;
  }

  function inject(name, root) {
    var tpl = root.querySelector("#tpl-" + name);
    if (!tpl) return;
    document.querySelectorAll('[data-include="' + name + '"]').forEach(function (mount) {
      // Clone the template content and ensure any <script> tags inside the template
      // are replaced with freshly created <script> elements so they execute when
      // the fragment is inserted into the document.
      var fragment = tpl.content.cloneNode(true);
      var scripts = fragment.querySelectorAll('script');
      scripts.forEach(function (oldScript) {
        var newScript = document.createElement('script');
        // copy attributes (src, type, id, async, defer, etc.)
        for (var i = 0; i < oldScript.attributes.length; i++) {
          var attr = oldScript.attributes[i];
          newScript.setAttribute(attr.name, attr.value);
        }
        // copy inline script content (if any)
        if (oldScript.textContent) newScript.textContent = oldScript.textContent;
        // replace the inert script in the fragment with the new one
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      mount.replaceWith(fragment);
    });
  }

  function setActiveNav() {
    var path = currentPath();
    var links = document.querySelectorAll("nav .nav-link");
    links.forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === path || (path === "index.html" && href === "index.html")) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      } else {
        a.classList.remove("active");
        a.removeAttribute("aria-current");
      }
    });
  }

  function adjustFooterForContact() {
    var path = currentPath();
    if (path !== "contact.html") return;
    document.querySelectorAll('footer .footer-menu a[href="contact.html#privacy"]').forEach(function (a) {
      a.setAttribute("href", "#privacy");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    fetch("partials.html", { credentials: "same-origin" })
      .then(function (res) {
        return res.text();
      })
      .then(function (html) {
        var holder = document.createElement("div");
        holder.innerHTML = html;

        inject("skip", holder);
        inject("preloader", holder);
        inject("navbar", holder);
        inject("footer", holder);

        setActiveNav();
        adjustFooterForContact();
      })
      .catch(function () {
        // If partials fail to load, leave the placeholders alone.
      });
  });
})();
