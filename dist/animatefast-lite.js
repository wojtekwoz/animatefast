/*! gFLUO Motion Standard prototype v0.1.1
 *  Needs gsap + ScrollTrigger + SplitText (all free: https://gsap.com/standard-license).
 *  Attributes: data-motion, data-motion-trigger|delay|duration|stagger|start|from. Legacy data-gsap aliases kept. */
(function() {
  "use strict";
  var W = window, D = document, H = D.documentElement;
  var VERSION = "0.1.1";
  var mq = function(q) {
    return !!(W.matchMedia && W.matchMedia(q).matches);
  };
  var REDUCED = mq("(prefers-reduced-motion: reduce)");
  var HOVER = mq("(hover: hover) and (pointer: fine)");
  var READY = "data-motion-ready";
  var seen = /* @__PURE__ */ new WeakSet(), warned = {};
  var FX = {};
  function warn(m) {
    if (!warned[m]) {
      warned[m] = 1;
      console.warn("[motion-standard] " + m);
    }
  }
  function reveal() {
    H.classList.add("ms-reveal");
  }
  var ALIAS = {
    "txt.1": "char-fade-down",
    "free.2": "char-flip-y",
    "txt.16": "char-scale-blur",
    "free.3": "char-pop",
    "free.1": "char-wave",
    "txt.10": "typewriter",
    "txt.20": "word-slide-up",
    "par.1": "line-slide-up",
    "el.6": "element-from-bottom",
    "el.5": "element-scale-in",
    "el.4": "element-from-left",
    "el.1": "element-from-right",
    "img.8": "image-rise-tilt",
    "txt.7": "blur-in",
    "txt.11": "counter",
    "txt.12": "word-rotate",
    "par.4": "line-grow-y",
    "par.9": "line-skew",
    "img.1": "image-clip-center",
    "img.2": "image-circle-scale",
    "img.4": "image-wipe",
    "img.3": ["image-wipe", "bottom"],
    "img.5": ["image-wipe", "left"],
    "img.6": ["image-wipe", "right"],
    "img.7": "image-blur-scale",
    "btn.8": "button-underline",
    "btn.1": "button-ripple",
    "btn.5": "button-grow",
    "btn.4": "button-radius",
    "btn.6": "magnetic",
    "el.3": "magnetic",
    "btn.7": ["magnetic", "text"]
  };
  var LEGACY_ATTR = { "gfluo-trigger": "data-motion-trigger", "gfluo-delay": "data-motion-delay", "gfluo-duration": "data-motion-duration", "gfluo-scroll-start": "data-motion-start" };
  function aliases(root) {
    [].forEach.call((root || D).querySelectorAll("[data-gsap]:not([data-motion])"), function(el) {
      var id = el.getAttribute("data-gsap"), a = ALIAS[id];
      if (!a) {
        warn('legacy data-gsap="' + id + '" has no Motion Standard v1 equivalent, left alone');
        return;
      }
      var arr = Array.isArray(a);
      el.setAttribute("data-motion", arr ? a[0] : a);
      if (arr) el.setAttribute("data-motion-from", a[1]);
      for (var k in LEGACY_ATTR) if (el.hasAttribute(k) && !el.hasAttribute(LEGACY_ATTR[k])) el.setAttribute(LEGACY_ATTR[k], el.getAttribute(k));
    });
  }
  function nm(el, n) {
    var v = parseFloat(el.getAttribute("data-motion-" + n));
    return isNaN(v) ? void 0 : v;
  }
  function opts(el) {
    var tr = el.getAttribute("data-motion-trigger");
    return {
      trigger: tr === "load" || tr === "hover" ? tr : "scroll",
      delay: nm(el, "delay") || 0,
      duration: nm(el, "duration"),
      stagger: nm(el, "stagger"),
      start: el.getAttribute("data-motion-start") || "top 80%",
      from: el.getAttribute("data-motion-from")
    };
  }
  function stg(o, d) {
    return o.stagger === void 0 ? d : { each: o.stagger, from: d && d.from, ease: d && d.ease };
  }
  // Default start "top 80%" is unreachable for elements in the last ~20% of the
  // final screen (footers). GSAP clamp() moves the start up to max scroll so the
  // effect still fires. An explicit data-motion-start is honoured and also clamped
  // if that value would itself be unreachable.
  function clampedStart(s) {
    s = s || "top 80%";
    return s.indexOf("clamp(") === 0 ? s : "clamp(" + s + ")";
  }
  // onEnter only fires when scroll moves past start, so a start clamped to the
  // current scroll (short page, first screen, page bottom) never fires. check()
  // plays anything whose start is reached, on every refresh and (at most once per
  // frame) on scroll. The window scroll listener is attached only while something
  // is pending; ScrollTrigger scrollEnd covers a host-set non-window scroller.
  var pending = [], hooked = false, listening = false, queued = false;
  var raf = W.requestAnimationFrame || function(f) {
    return setTimeout(f, 16);
  };
  function check() {
    pending = pending.filter(function(p) {
      if (!p.done && p.st.start <= p.st.scroll() + 1) p.go();
      return !p.done;
    });
    if (!pending.length && listening) {
      listening = false;
      W.removeEventListener("scroll", schedule);
    }
  }
  function schedule() {
    if (queued || !pending.length) return;
    queued = true;
    raf(function() {
      queued = false;
      check();
    });
  }
  function arm(el, o, play) {
    if (o.trigger === "load") return play();
    var p = { go: function() {
      if (p.done) return;
      p.done = true;
      p.st && p.st.kill();
      play();
    } };
    p.st = ScrollTrigger.create({ trigger: el, start: clampedStart(o.start), once: true, onEnter: p.go });
    pending.push(p);
    if (!listening) {
      listening = true;
      W.addEventListener("scroll", schedule, { passive: true });
    }
  }
  function sibIndex(el) {
    var n = 0, s = el.parentElement ? el.parentElement.children : [];
    for (var i = 0; i < s.length && s[i] !== el; i++) if (s[i].getAttribute("data-motion") === el.getAttribute("data-motion")) n++;
    return n;
  }
  function text(type, from, d) {
    return function(el, o) {
      var started = false, anim, st = type === "chars" ? "words,chars" : type;
      SplitText.create(el, {
        type: st,
        tag: "span",
        autoSplit: type === "lines",
        aria: "auto",
        onSplit: function(self) {
          var t = self[type];
          if (started) return;
          gsap.set(type === "chars" ? self.words.concat(t) : t, { display: type === "lines" ? "block" : "inline-block" });
          anim = gsap.from(t, {
            ...from,
            duration: o.duration || d.duration,
            ease: d.ease,
            stagger: stg(o, d.stagger),
            delay: o.delay,
            paused: true,
            clearProps: Object.keys(from).join(",")
          });
          return anim;
        }
      });
      arm(el, o, function() {
        started = true;
        anim && anim.play();
      });
    };
  }
  function box(from, to, d) {
    return function(el, o) {
      var delay = o.delay + Math.min((o.stagger || 0) * sibIndex(el), 1), back = snap(el);
      var v = { duration: o.duration || d.duration, ease: d.ease, delay, paused: true, onComplete: function() {
        gsap.set(el, { clearProps: "all" });
        back();
      } };
      var a = to ? gsap.fromTo(el, from, { ...to, ...v }) : gsap.from(el, { ...from, ...v });
      arm(el, o, function() {
        a.play();
      });
    };
  }
  function snap(el) {
    var s = el.getAttribute("style");
    return function() {
      if (s === null) el.removeAttribute("style");
      else el.setAttribute("style", s);
    };
  }
  function nl(el) {
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
  }
  FX["char-fade-down"] = text("chars", { opacity: 0, y: -20 }, { duration: 0.4, stagger: 0.03, ease: "power2.out" });
  FX["char-flip-y"] = text("chars", { opacity: 0, rotationY: -180, transformOrigin: "center center" }, { duration: 0.8, stagger: { amount: 1 }, ease: "power2.out" });
  FX["char-scale-blur"] = text("chars", { opacity: 0, scale: 2, filter: "blur(10px)" }, { duration: 0.8, stagger: 0.03, ease: "power2.out" });
  FX["char-pop"] = text("chars", { opacity: 0, scale: 0 }, { duration: 0.4, stagger: { amount: 0.8 }, ease: "back.out(2)" });
  FX["char-wave"] = text("chars", { opacity: 0, y: 40 }, { duration: 0.3, stagger: { each: 0.02, ease: "sine.inOut" }, ease: "power2.out" });
  FX["word-slide-up"] = text("words", { opacity: 0, y: 50 }, { duration: 0.8, stagger: 0.1, ease: "power2.out" });
  FX["line-slide-up"] = text("lines", { opacity: 0, y: 20 }, { duration: 0.8, stagger: { amount: 0.15 }, ease: "power2.out" });
  FX["element-from-bottom"] = box({ opacity: 0, y: 88 }, 0, { duration: 0.75, ease: "back.inOut(2)" });
  FX["element-from-left"] = box({ opacity: 0, x: -100 }, 0, { duration: 0.75, ease: "back.inOut(2)" });
  FX["element-scale-in"] = box({ opacity: 0, scale: 0 }, 0, { duration: 0.5, ease: "power1.inOut" });
  FX["image-rise-tilt"] = box({ opacity: 0, y: 100, rotation: 5 }, 0, { duration: 1.2, ease: "power2.out" });
  FX["typewriter"] = function(el, o) {
    var started = false, cursor, chars, speed = o.stagger || 0.05;
    SplitText.create(el, {
      type: "words,chars",
      tag: "span",
      autoSplit: false,
      aria: "auto",
      onSplit: function(self) {
        chars = self.chars;
        gsap.set(self.words.concat(chars), { display: "inline-block" });
        gsap.set(chars, { opacity: 0 });
      }
    });
    arm(el, o, function() {
      if (started) return;
      started = true;
      cursor = D.createElement("span");
      cursor.textContent = "|";
      cursor.setAttribute("aria-hidden", "true");
      cursor.style.fontWeight = "100";
      el.appendChild(cursor);
      gsap.to(cursor, { opacity: 0, repeat: -1, yoyo: true, duration: 0.6, ease: "expo.inOut" });
      var tl = gsap.timeline({ delay: o.delay });
      chars.forEach(function(c, i) {
        tl.set(c, { opacity: 1 }, i * speed);
      });
    });
  };
  if (false) {
    FX["element-from-right"] = box({ opacity: 0, x: 88 }, 0, { duration: 0.75, ease: "back.inOut(2)" });
    FX["blur-in"] = box({ opacity: 0, scale: 0.5, filter: "blur(20px)" }, { opacity: 1, scale: 1, filter: "blur(0px)" }, { duration: 1, ease: "power2.out" });
    FX["line-grow-y"] = text("lines", { opacity: 0, y: 20, scaleY: 0 }, { duration: 1, stagger: { amount: 0.15 }, ease: "circ.out" });
    FX["line-skew"] = text("lines", { opacity: 0, y: 100, skewX: 20 }, { duration: 0.8, stagger: { amount: 0.6 }, ease: "power1.out" });
    FX["image-clip-center"] = box({ opacity: 0, clipPath: "inset(50% 50% 50% 50%)" }, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }, { duration: 1.5, ease: "power1.out" });
    FX["image-circle-scale"] = box({ opacity: 0, borderRadius: "50%", scale: 0.5 }, 0, { duration: 1, ease: "power2.out" });
    FX["image-blur-scale"] = box({ opacity: 0, scale: 1.5, filter: "blur(12px)" }, { opacity: 1, scale: 1, filter: "blur(0px)" }, { duration: 1.5, ease: "power2.out" });
    var WIPE = { center: "inset(0% 50% 0% 50%)", left: "inset(0% 100% 0% 0%)", right: "inset(0% 0% 0% 100%)", bottom: "inset(100% 0% 0% 0%)", top: "inset(0% 0% 100% 0%)" };
    FX["image-wipe"] = function(el, o) {
      var f = WIPE[o.from] ? o.from : "center", vert = f === "bottom" || f === "top";
      box({ opacity: 0, clipPath: WIPE[f] }, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }, { duration: vert ? 1.5 : 1, ease: vert ? "power2.inOut" : "power1.out" })(el, o);
    };
    FX["counter"] = function(el, o) {
      var orig = el.textContent, m = orig.match(/^([^\d-]*)(-?[\d,]*\.?\d+)([\s\S]*)$/);
      if (!m) return warn("counter needs a number in the text");
      var n = parseFloat(m[2].replace(/,/g, "")), dec = (m[2].split(".")[1] || "").length, grp = m[2].indexOf(",") > -1, obj = { v: 0 };
      var fmt = function(v) {
        return m[1] + v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: grp }) + m[3];
      };
      el.style.fontVariantNumeric = "tabular-nums";
      el.textContent = fmt(0);
      var a = gsap.to(obj, { v: n, duration: o.duration || 2, ease: "power2.out", delay: o.delay, paused: true, onUpdate: function() {
        el.textContent = fmt(obj.v);
      }, onComplete: function() {
        el.textContent = orig;
      } });
      arm(el, o, function() {
        a.play();
      });
    };
    FX["word-rotate"] = function(el, o) {
      var words = el.textContent.split(",").map(function(s) {
        return s.trim();
      }).filter(Boolean);
      if (words.length < 2) return warn("word-rotate needs 2+ comma separated words");
      var i = 0, span = D.createElement("span"), call, running = false, every = o.duration || 2;
      span.style.display = "inline-block";
      span.textContent = words[0];
      el.textContent = "";
      el.appendChild(span);
      el.setAttribute("aria-label", words.join(", "));
      function next() {
        gsap.to(span, { opacity: 0, y: -20, duration: 0.5, ease: "power2.in", onComplete: function() {
          i = (i + 1) % words.length;
          span.textContent = words[i];
          gsap.fromTo(span, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", clearProps: "transform" });
        } });
        call = gsap.delayedCall(every + 1, next);
      }
      function run(on) {
        if (on && !running) {
          running = true;
          call = gsap.delayedCall(every, next);
        } else if (!on && running) {
          running = false;
          call && call.kill();
        }
      }
      ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onToggle: function(s) {
        run(s.isActive);
      } });
    };
    var hover = function(fn) {
      return function(el, o) {
        if (REDUCED || !HOVER) return;
        fn(el, o);
      };
    };
    FX["magnetic"] = hover(function(el, o) {
      var inner = o.from === "text", t = el, k = inner ? 0.2 : 0.1, r, back = snap(el), tin;
      if (inner) {
        t = el.querySelector("span");
        if (!t) {
          t = D.createElement("span");
          while (el.firstChild) t.appendChild(el.firstChild);
          el.appendChild(t);
        }
        t.style.display = "inline-block";
        t.style.pointerEvents = "none";
      }
      var qx = gsap.quickTo(t, "x", { duration: 0.3, ease: "power2.out" }), qy = gsap.quickTo(t, "y", { duration: 0.3, ease: "power2.out" });
      el.addEventListener("mouseenter", function() {
        r = el.getBoundingClientRect();
        tin = 1;
        gsap.to(el, { scale: 1.1, duration: 0.3, ease: "power2.out", overwrite: "auto" });
      });
      el.addEventListener("mousemove", function(e) {
        if (!r) return;
        qx((e.clientX - (r.left + r.width / 2)) * k);
        qy((e.clientY - (r.top + r.height / 2)) * k);
      });
      el.addEventListener("mouseleave", function() {
        r = 0;
        tin = 0;
        qx(0);
        qy(0);
        gsap.to(el, { scale: 1, duration: 0.3, ease: "power2.out", overwrite: "auto" });
        gsap.delayedCall(0.5, function() {
          if (!tin) {
            gsap.set(el, { clearProps: "all" });
            back();
          }
        });
      });
    });
    FX["button-underline"] = hover(function(el) {
      nl(el);
      var u = D.createElement("span");
      u.setAttribute("aria-hidden", "true");
      u.style.cssText = "position:absolute;left:0;bottom:0;width:100%;height:1px;background:currentColor;transform:scaleX(0);pointer-events:none";
      el.appendChild(u);
      var side = function(e) {
        var r = el.getBoundingClientRect();
        return e.clientX < r.left + r.width / 2;
      };
      el.addEventListener("mouseenter", function(e) {
        gsap.set(u, { transformOrigin: side(e) ? "left center" : "right center" });
        gsap.to(u, { scaleX: 1, duration: 0.2, ease: "power2.out", overwrite: true });
      });
      el.addEventListener("mouseleave", function(e) {
        gsap.set(u, { transformOrigin: side(e) ? "left center" : "right center" });
        gsap.to(u, { scaleX: 0, duration: 0.2, ease: "power2.in", overwrite: true });
      });
    });
    FX["button-ripple"] = hover(function(el) {
      nl(el);
      el.style.overflow = "hidden";
      var ov = D.createElement("span");
      ov.setAttribute("aria-hidden", "true");
      ov.style.cssText = "position:absolute;inset:0;background:#00000030;pointer-events:none;clip-path:circle(0% at 50% 50%)";
      el.appendChild(ov);
      var pos = function(e) {
        var r = el.getBoundingClientRect();
        return " at " + (e.clientX - r.left) / r.width * 100 + "% " + (e.clientY - r.top) / r.height * 100 + "%)";
      };
      el.addEventListener("mouseenter", function(e) {
        gsap.fromTo(ov, { clipPath: "circle(0%" + pos(e) }, { clipPath: "circle(141.4%" + pos(e), duration: 0.3, ease: "power1.in", overwrite: true });
      });
      el.addEventListener("mouseleave", function(e) {
        gsap.to(ov, { clipPath: "circle(0%" + pos(e), duration: 0.3, ease: "power1.out", overwrite: true });
      });
    });
    FX["button-grow"] = hover(function(el) {
      var pl, pr, back = snap(el);
      el.addEventListener("mouseenter", function() {
        if (!gsap.isTweening(el)) {
          var c = getComputedStyle(el);
          pl = parseFloat(c.paddingLeft);
          pr = parseFloat(c.paddingRight);
        }
        gsap.to(el, { paddingLeft: pl * 1.5, paddingRight: pr * 1.5, scale: 1.1, duration: 0.3, ease: "back.out(4)", overwrite: true });
      });
      el.addEventListener("mouseleave", function() {
        gsap.to(el, { paddingLeft: pl, paddingRight: pr, scale: 1, duration: 0.3, ease: "back.out(4)", overwrite: true, onComplete: function() {
          gsap.set(el, { clearProps: "all" });
          back();
        } });
      });
    });
    FX["button-radius"] = hover(function(el) {
      var r0 = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, to = r0 >= 25 ? 0 : 50, back = snap(el);
      el.addEventListener("mouseenter", function() {
        gsap.to(el, { borderRadius: to, scale: 1.1, duration: 0.3, ease: "circ.out", overwrite: true });
      });
      el.addEventListener("mouseleave", function() {
        gsap.to(el, { borderRadius: r0, scale: 1, duration: 0.3, ease: "circ.out", overwrite: true, onComplete: function() {
          gsap.set(el, { clearProps: "all" });
          back();
        } });
      });
    });
  }
  var HOVERFX = { "magnetic": 1, "button-underline": 1, "button-ripple": 1, "button-grow": 1, "button-radius": 1 };
  function setup(el) {
    var id = el.getAttribute("data-motion"), fn = FX[id];
    try {
      if (!fn) warn('unknown effect "' + id + '"' + (HOVERFX[id] ? " (pack only)" : ""));
      else if (HOVERFX[id]) fn(el, opts(el));
      else if (!REDUCED) fn(el, opts(el));
      else if (id === "word-rotate") el.textContent = el.textContent.split(",")[0].trim();
    } catch (e) {
      warn('effect "' + id + '" failed: ' + e.message);
    }
    el.setAttribute(READY, "");
  }
  function init(root) {
    if (!W.gsap || !W.ScrollTrigger || !W.SplitText) {
      console.error("[motion-standard] gsap, ScrollTrigger and SplitText must load before this script");
      return reveal();
    }
    gsap.registerPlugin(ScrollTrigger, SplitText);
    if (!hooked) {
      hooked = true;
      ScrollTrigger.addEventListener("refresh", check);
      ScrollTrigger.addEventListener("scrollEnd", schedule);
    }
    aliases(root);
    var els = [].slice.call((root || D).querySelectorAll("[data-motion]")).filter(function(el) {
      return !seen.has(el) && seen.add(el);
    });
    els.forEach(setup);
    if (els.length && !REDUCED) ScrollTrigger.refresh();
  }
  function boot() {
    var go = function() {
      init();
    };
    var f = D.fonts && D.fonts.ready;
    if (f && !REDUCED) Promise.race([f, new Promise(function(r) {
      setTimeout(r, 1500);
    })]).then(go);
    else go();
  }
  W.MotionStandard = { version: VERSION, refresh: function(root) {
    init(root);
  }, effects: Object.keys(FX), reducedMotion: REDUCED, hover: HOVER };
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
