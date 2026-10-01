(function () {
  "use strict";

  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  var navigationEntries = window.performance &&
    window.performance.getEntriesByType("navigation");
  var isReload = navigationEntries && navigationEntries[0] &&
    navigationEntries[0].type === "reload";

  if (isReload) {
    window.requestAnimationFrame(function () {
      window.scrollTo(0, 0);
    });
    window.addEventListener("pageshow", function (event) {
      if (!event.persisted) window.scrollTo(0, 0);
    });
  }

  function addContactMessageCopy(root) {
    var button = root.querySelector("[data-copy-contact-message]");
    if (!button || button.dataset.tmCopyReady === "true") return;

    button.dataset.tmCopyReady = "true";
    button.addEventListener("click", function () {
      var messageField = root.querySelector("#contact-message");
      var status = root.querySelector(".tm-contact-copy-status");
      if (!messageField) return;

      function showCopied() {
        if (status) status.textContent = "Message copied.";
      }

      function copyFallback() {
        messageField.focus();
        messageField.select();
        if (document.execCommand("copy")) {
          showCopied();
        } else if (status) {
          status.textContent = "Select and copy the message above.";
        }
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(messageField.value).then(showCopied, copyFallback);
      } else {
        copyFallback();
      }
    });
  }

  function addMarketTicker(root) {
    var container = root.querySelector("[data-tm-market-config]");
    if (!container || container.dataset.tmMarketReady === "true") return;

    var config;
    try {
      config = JSON.parse(container.getAttribute("data-tm-market-config"));
    } catch (error) {
      return;
    }

    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.textContent = JSON.stringify(config);
    container.appendChild(script);
    container.dataset.tmMarketReady = "true";
  }

  function syncFooterPrograms(root) {
    var programs = [
      "Managed Portfolios",
      "Daily Forex Signals",
      "1-on-1 Mentorship",
      "Automated Trading Systems"
    ];
    var headings = Array.prototype.slice.call(root.querySelectorAll("footer *"));

    headings.forEach(function (heading) {
      if (heading.children.length || heading.textContent.trim() !== "Programs") return;

      var list = heading.nextElementSibling;
      if (!list) return;

      var itemTag = list.tagName === "UL" ? "li" : "div";
      var current = Array.prototype.map.call(list.children, function (item) {
        return item.textContent.trim();
      });
      if (current.length === programs.length && current.every(function (item, index) {
        return item === programs[index];
      })) return;

      var fragment = document.createDocumentFragment();
      programs.forEach(function (program) {
        var item = document.createElement(itemTag);
        item.textContent = program;
        fragment.appendChild(item);
      });
      list.replaceChildren(fragment);
    });
  }

  function addLiveClock(root) {
    if (root.dataset.tmClockReady === "true") return;

    var bar = root.querySelector('[class*="bg-[#1A080C]"]');
    if (!bar) {
      if (root.classList.contains("tm-page")) {
        root.dataset.tmClockReady = "true";
      }
      return;
    }

    var clock = document.createElement("span");
    clock.className = "tm-live-clock";
    clock.setAttribute("aria-label", "Live local date and time");
    clock.innerHTML =
      '<span class="tm-live-clock-date"></span>' +
      '<span class="tm-live-clock-time"></span>' +
      '<span class="tm-live-clock-zone"></span>';
    bar.appendChild(clock);

    var dateElement = clock.querySelector(".tm-live-clock-date");
    var timeElement = clock.querySelector(".tm-live-clock-time");
    var zoneElement = clock.querySelector(".tm-live-clock-zone");
    var dateFormatter = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    var timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
    var zoneFormatter = new Intl.DateTimeFormat(undefined, {
      timeZoneName: "short"
    });
    var localZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time";

    function updateClock() {
      var now = new Date();
      var zoneParts = zoneFormatter.formatToParts(now);
      var zonePart = zoneParts.find(function (part) {
        return part.type === "timeZoneName";
      });

      dateElement.textContent = dateFormatter.format(now);
      timeElement.textContent = timeFormatter.format(now);
      zoneElement.textContent = zonePart
        ? zonePart.value
        : localZone.replace(/_/g, " ");
    }

    updateClock();
    window.setInterval(updateClock, 1000);
    root.dataset.tmClockReady = "true";
  }

  function addScrollReveal(root) {
    if (root.dataset.tmRevealReady === "true") return;

    var sections = Array.prototype.slice.call(
      root.querySelectorAll("section, footer")
    );
    if (!sections.length) {
      if (root.classList.contains("tm-page")) {
        root.dataset.tmRevealReady = "true";
      }
      return;
    }

    var cards = Array.prototype.slice.call(
      root.querySelectorAll(
        "#services .group, #about .grid > div, #contact .grid > div, .tm-service-item, .tm-founder-card, .tm-about-value"
      )
    );
    var targets = sections.concat(cards);
    root.dataset.tmRevealReady = "true";

    sections.forEach(function (element, index) {
      element.classList.add("tm-reveal");
      element.style.transitionDelay = Math.min(index * 80, 240) + "ms";
    });

    cards.forEach(function (element, index) {
      element.classList.add("tm-reveal-card");
      element.style.transitionDelay = Math.min(index * 90, 360) + "ms";
    });

    function revealVisibleTargets() {
      root.querySelectorAll(".tm-reveal, .tm-reveal-card").forEach(function (element) {
        var bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight * 0.9 && bounds.bottom > 0) {
          element.classList.add("tm-visible");
        }
      });
    }

    revealVisibleTargets();
    window.addEventListener("scroll", revealVisibleTargets, { passive: true });
    window.addEventListener("resize", revealVisibleTargets);
    window.addEventListener("pageshow", revealVisibleTargets);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        window.requestAnimationFrame(revealVisibleTargets);
      }
    });

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (element) {
        element.classList.add("tm-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("tm-visible");
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.12
    });

    targets.forEach(function (element) {
      observer.observe(element);
    });
  }

  function routeSectionLinks(root) {
    var routes = {
      "#services": "services.html",
      "#about": "about.html"
    };

    Object.keys(routes).forEach(function (section) {
      root.querySelectorAll('a[href="' + section + '"]').forEach(function (link) {
        link.href = routes[section];
      });
    });
  }

  function init() {
    var root = document.getElementById("root") || document.querySelector(".tm-page");
    if (!root) return;

    routeSectionLinks(root);
    addLiveClock(root);
    addScrollReveal(root);
    addContactMessageCopy(root);
    addMarketTicker(root);
    syncFooterPrograms(root);

    if (
      root.dataset.tmClockReady !== "true" ||
      root.dataset.tmRevealReady !== "true"
    ) {
      window.requestAnimationFrame(init);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    window.requestAnimationFrame(init);
  }
})();