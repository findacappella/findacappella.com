(function ($) {
  "use strict";

  function loadEvents() {
    const t = (window.CMCA_I18N && window.CMCA_I18N.t) || (() => null);
    fetch("activities.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const eventsContainer = document.getElementById("events-container");
        if (!eventsContainer) return; // nothing to render into
        // Clear any existing events
        eventsContainer.innerHTML = "";

        // Filter out events that ended more than one week ago, then sort
        const currentDate = new Date();
        const oneWeekAgo = new Date(currentDate);
        oneWeekAgo.setDate(currentDate.getDate() - 7);

        const eventsWithDates = data.map((event) => {
          const [y, m, d] = event.date.split("-").map((s) => parseInt(s, 10));
          return { ...event, eventDate: new Date(y, m - 1, d) };
        });

        const upcomingEvents = eventsWithDates
          .filter(({ eventDate }) => eventDate >= oneWeekAgo) // hide events that ended more than 7 days ago
          .sort((a, b) => a.eventDate - b.eventDate);

        if (upcomingEvents.length === 0) {
          eventsContainer.innerHTML = `<div class="col-12 text-center"><p data-i18n="home.events.empty">${t("home.events.empty") || "No upcoming events at this time. Check back soon!"}</p></div>`;
          return;
        }

        upcomingEvents.forEach((event) => {
          const monthName = new Date(2000, event.eventDate.getMonth(), 1).toLocaleString("default", { month: "short" }).toUpperCase();
          const day = event.eventDate.getDate();
          const year = event.eventDate.getFullYear();

          const col = document.createElement("div");
          col.className = "col-lg-4 col-md-6 col-12";

          const link = document.createElement("a");
          link.href = event.url;
          link.className = "calendar-card";

          const accent = document.createElement("span");
          accent.className = "calendar-accent";
          accent.setAttribute("aria-hidden", "true");
          link.appendChild(accent);

          const monthDiv = document.createElement("div");
          monthDiv.className = "calendar-month";
          monthDiv.textContent = monthName + " " + year;
          link.appendChild(monthDiv);

          const dayDiv = document.createElement("div");
          dayDiv.className = "calendar-day";
          dayDiv.textContent = day;
          link.appendChild(dayDiv);

          const content = document.createElement("div");
          content.className = "calendar-content";

          const timeDiv = document.createElement("div");
          timeDiv.className = "calendar-time";
          timeDiv.textContent = event.time;
          content.appendChild(timeDiv);

          const descDiv = document.createElement("div");
          descDiv.className = "calendar-description";
          descDiv.textContent = event.description;
          content.appendChild(descDiv);

          if (event.description2) {
            const desc2Div = document.createElement("div");
            desc2Div.className = "calendar-description";
            desc2Div.textContent = event.description2;
            content.appendChild(desc2Div);
          }

          link.appendChild(content);
          col.appendChild(link);
          eventsContainer.appendChild(col);
        });
      })
      .catch((error) => {
        console.error("Error loading events:", error);
        const eventsContainer = document.getElementById("events-container");
        if (eventsContainer) {
          eventsContainer.innerHTML = `<div class="col-12 text-center"><p class="text-muted" data-i18n="home.events.error">${t("home.events.error") || 'Unable to load events at this time. Please check back later or <a href="contact.html">contact us</a> for upcoming events.'}</p></div>`;
        }
      });
  }
  window.CMCA_reloadEvents = loadEvents;

  // PRE LOADER: ensure it hides even if injected after window 'load' (race with includes.js fetch)
  $(document).ready(function () {
    // Load events for the calendar section
    loadEvents();
    function tryHideOnce() {
      const $pre = $(".preloader");
      if ($pre.length) {
        $pre.delay(500).fadeOut("slow");
        return true;
      }
      return false;
    }

    $(window).on("load", function () {
      if (tryHideOnce()) return;
      // Retry briefly in case the preloader template is injected after the load event
      var attempts = 100; // ~5s max (100 * 50ms)
      var iv = setInterval(function () {
        if (tryHideOnce() || --attempts <= 0) {
          clearInterval(iv);
        }
      }, 50);
    });
  });

  // Re-render events when language changes so inline text matches selection
  document.addEventListener("i18n:languageChanged", function () {
    loadEvents();
  });

  // NAVBAR — bind after partials are injected so the navbar element exists
  document.addEventListener("partials:loaded", function () {
    $(".navbar").headroom();
    $(".navbar-collapse a").click(function () {
      $(".navbar-collapse").collapse("hide");
    });
  });

  $(".slick-slideshow").slick({
    autoplay: true,
    infinite: true,
    arrows: false,
    fade: true,
    dots: true,
  });
})(window.jQuery);
