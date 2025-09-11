(function ($) {
  "use strict";

  function loadEvents() {
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

        // Filter out past events and sort upcoming events
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();

        // Parse dates using numeric Date(...) to avoid timezone parsing issues ("YYYY-MM-DD" -> UTC shifts)
        const upcomingEvents = data
          .filter((event) => {
            const [m, d] = event.date.split("-").map((s) => parseInt(s, 10));
            let eventDate = new Date(currentYear, m - 1, d);
            // If the event date has passed this year, consider next year
            if (eventDate < currentDate) {
              eventDate = new Date(currentYear + 1, m - 1, d);
            }
            return eventDate >= currentDate;
          })
          .sort((a, b) => {
            const [ma, da] = a.date.split("-").map((s) => parseInt(s, 10));
            const [mb, db] = b.date.split("-").map((s) => parseInt(s, 10));
            let dateA = new Date(currentYear, ma - 1, da);
            let dateB = new Date(currentYear, mb - 1, db);
            if (dateA < currentDate) dateA = new Date(currentYear + 1, ma - 1, da);
            if (dateB < currentDate) dateB = new Date(currentYear + 1, mb - 1, db);
            return dateA - dateB;
          });

        if (upcomingEvents.length === 0) {
          eventsContainer.innerHTML = '<div class="col-12 text-center"><p>No upcoming events at this time. Check back soon!</p></div>';
          return;
        }

        upcomingEvents.forEach((event) => {
          const [month, day] = event.date.split("-").map((s) => parseInt(s, 10));
          const monthName = new Date(2000, month - 1, 1).toLocaleString("default", { month: "short" }).toUpperCase();

          const eventCard = `
            <div class="col-lg-4 col-md-6 col-12">
              <a href="${event.url}" class="calendar-card">
                <span class="calendar-accent" aria-hidden="true"></span>
                <div class="calendar-month">${monthName}</div>
                <div class="calendar-day">${parseInt(day)}</div>
                <div class="calendar-content">
                  <div class="calendar-time">${event.time}</div>
                  <div class="calendar-description">${event.description}</div>
                </div>
              </a>
            </div>
          `;
          eventsContainer.insertAdjacentHTML("beforeend", eventCard);
        });
      })
      .catch((error) => console.error("Error loading events:", error));
  }

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
