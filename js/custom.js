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
        const currentYear = currentDate.getFullYear();
        const oneWeekAgo = new Date(currentDate);
        oneWeekAgo.setDate(currentDate.getDate() - 7);

        const eventsWithDates = data.map((event) => {
          const [m, d] = event.date.split("-").map((s) => parseInt(s, 10));
          return { ...event, eventDate: new Date(currentYear, m - 1, d) };
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

          const description2 = event.description2 ? `<div class="calendar-description">${event.description2}</div>` : "";
          const eventCard = `
            <div class="col-lg-4 col-md-6 col-12">
              <a href="${event.url}" class="calendar-card">
                <span class="calendar-accent" aria-hidden="true"></span>
                <div class="calendar-month">${monthName}</div>
                <div class="calendar-day">${parseInt(day)}</div>
                <div class="calendar-content">
                  <div class="calendar-time">${event.time}</div>
                  <div class="calendar-description">${event.description}</div>
                  ${description2}
                </div>
              </a>
            </div>
          `;
          eventsContainer.insertAdjacentHTML("beforeend", eventCard);
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

  // NAVBAR
  $(".navbar").headroom();

  $(".navbar-collapse a").click(function () {
    $(".navbar-collapse").collapse("hide");
  });

  $(".slick-slideshow").slick({
    autoplay: true,
    infinite: true,
    arrows: false,
    fade: true,
    dots: true,
  });

  $(".slick-testimonial").slick({
    arrows: false,
    dots: true,
  });
})(window.jQuery);
