(function ($) {
  "use strict";

  // PRE LOADER: ensure it hides even if injected after window 'load' (race with includes.js fetch)
  $(document).ready(function () {
    function tryHideOnce() {
      var $pre = $(".preloader");
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
