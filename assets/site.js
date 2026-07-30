(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const body = document.body;
  let lenis = null;
  let headerFloating = null;
  let scrollRenderFrame = 0;
  let scrollMotionTargets = null;

  const setHeaderState = (scrollY = window.scrollY) => {
    const nextFloating = scrollY >= 10;
    if (nextFloating === headerFloating) return;
    headerFloating = nextFloating;
    body.classList.toggle("has-floating-nav", nextFloating);
  };

  const clamp = (value, minimum = 0, maximum = 1) =>
    Math.max(minimum, Math.min(maximum, value));

  const activateCurrentNavigation = () => {
    const page = body.dataset.page || "home";
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === page) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const splitRevealCharacters = (element) => {
    if (!element || element.dataset.splitReady === "true") return;
    const text = element.textContent.trim();
    const words = text.split(/\s+/);
    element.dataset.splitReady = "true";
    element.setAttribute("aria-label", text);
    element.textContent = "";

    let characterIndex = 0;
    words.forEach((word) => {
      const wordShell = document.createElement("span");
      wordShell.className = "word-shell";
      wordShell.setAttribute("aria-hidden", "true");

      [...word].forEach((character) => {
        const span = document.createElement("span");
        span.className = "word-char";
        span.dataset.charIndex = String(characterIndex);
        span.textContent = character;
        wordShell.appendChild(span);
        characterIndex += 1;
      });

      element.appendChild(wordShell);
    });
  };

  const splitScrubWords = (element) => {
    if (!element || element.dataset.splitReady === "true") return;
    const text = element.textContent.trim();
    element.dataset.splitReady = "true";
    element.setAttribute("aria-label", text);
    element.textContent = "";

    text.split(/\s+/).forEach((word) => {
      const wrapper = document.createElement("span");
      wrapper.className = "scrub-word";
      wrapper.setAttribute("aria-hidden", "true");

      const base = document.createElement("span");
      base.className = "scrub-word-base";
      base.textContent = word;

      const live = document.createElement("span");
      live.className = "scrub-word-live";
      live.textContent = word;

      wrapper.append(base, live);
      element.appendChild(wrapper);
    });
  };

  const revealCharacters = (element, loadReveal = false) => {
    if (!element || element.dataset.revealed === "true") return;
    const characters = [...element.querySelectorAll(".word-char")];
    if (!characters.length) return;
    element.dataset.revealed = "true";

    if (reduceMotion) {
      characters.forEach((character) => {
        character.style.opacity = "1";
        character.style.transform = "none";
      });
      return;
    }

    const baseDelay = loadReveal ? 190 : 0;
    const stagger = characters.length > 42 ? 30 : 38;
    characters.forEach((character, index) => {
      const animation = character.animate(
        [
          { opacity: 0, transform: "translate3d(0, 0.18em, 0)" },
          { opacity: 1, transform: "translate3d(0, 0, 0)" },
        ],
        {
          duration: index % 2 === 0 ? 620 : 560,
          delay: baseDelay + Math.min(index * stagger, 1700),
          easing: "cubic-bezier(.16,1,.3,1)",
          fill: "both",
        },
      );

      animation.finished
        .then(() => {
          character.style.opacity = "1";
          character.style.transform = "none";
          animation.cancel();
        })
        .catch(() => {});
    });
  };

  const initReveals = () => {
    document.querySelectorAll("[data-word-reveal]").forEach((element) => {
      splitRevealCharacters(element);
      if (element.closest(".hero, .page-hero")) {
        element.classList.add("is-load-reveal");
      } else {
        element.classList.add("is-scroll-reveal");
      }
    });

    document.querySelectorAll("[data-scrub-text]").forEach((element) => {
      splitScrubWords(element);
    });

    const revealElements = document.querySelectorAll(".slow-reveal, .is-scroll-reveal");

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealElements.forEach((element) => element.classList.add("is-visible"));
      document
        .querySelectorAll("[data-word-reveal]")
        .forEach((element) => revealCharacters(element));
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .querySelectorAll(".is-load-reveal")
          .forEach((element) => revealCharacters(element, true));
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (entry.target.matches("[data-word-reveal]")) {
            revealCharacters(entry.target);
          } else {
            entry.target.classList.add("is-visible");
          }
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.13,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    revealElements.forEach((element) => observer.observe(element));
  };

  const getScrollMotionTargets = () => {
    if (scrollMotionTargets) return scrollMotionTargets;

    scrollMotionTargets = {
      scrub: [...document.querySelectorAll("[data-scrub-text]")].map((element) => ({
        element,
        words: [...element.querySelectorAll(".scrub-word-live")],
      })),
      parallax: [...document.querySelectorAll("[data-parallax]")].map((element) => ({
        element,
        strength: Number(element.dataset.parallax || 24),
      })),
      scenes: [...document.querySelectorAll("[data-decision-scene]")].map((scene) => ({
        scene,
        lens: scene.querySelector("[data-decision-lens]"),
        lanes: [...scene.querySelectorAll("[data-decision-lane]")].map((lane) => ({
          lane,
          direction: Number(lane.dataset.decisionLane || 1),
        })),
      })),
      healthBridges: [...document.querySelectorAll("[data-health-bridge]")].map((scene) => ({
        scene,
        blur: scene.querySelector("[data-health-bridge-blur]"),
        shade: scene.querySelector("[data-health-bridge-shade]"),
        copy: scene.querySelector("[data-health-bridge-copy]"),
        phones: [...scene.querySelectorAll("[data-health-bridge-phone]")].map((phone) => ({
          phone,
          enter: Number(phone.dataset.enter || 160),
          delay: Number(phone.dataset.delay || 0),
        })),
      })),
    };

    return scrollMotionTargets;
  };

  const renderScrollMotion = () => {
    setHeaderState(window.scrollY);
    if (reduceMotion) return;

    const viewportHeight = window.innerHeight;
    const targets = getScrollMotionTargets();

    // Read layout first, then write styles. This prevents a read/write loop from
    // forcing repeated synchronous layout work during a single scroll frame.
    const scrubFrames = targets.scrub.map((target) => ({
      ...target,
      rect: target.element.getBoundingClientRect(),
    }));
    const parallaxFrames = targets.parallax.map((target) => ({
      ...target,
      rect: target.element.getBoundingClientRect(),
    }));
    const sceneFrames = targets.scenes.map((target) => ({
      ...target,
      rect: target.scene.getBoundingClientRect(),
    }));
    const bridgeFrames = targets.healthBridges.map((target) => ({
      ...target,
      rect: target.scene.getBoundingClientRect(),
    }));

    scrubFrames.forEach(({ rect, words }) => {
      if (rect.top > viewportHeight + 120) return;
      if (rect.bottom < -120) {
        words.forEach((word) => {
          word.style.opacity = "1";
        });
        return;
      }

      const start = viewportHeight * 0.84;
      const end = viewportHeight * 0.22;
      const progress = clamp((start - rect.top) / (start - end));
      const spread = Math.max(words.length - 1, 1);

      words.forEach((word, index) => {
        const wordProgress = clamp(
          progress * 1.46 - (index / spread) * 0.46,
        );
        word.style.opacity = String(1 - Math.pow(1 - wordProgress, 3));
      });
    });

    parallaxFrames.forEach(({ element, rect, strength }) => {
      if (rect.bottom < -120 || rect.top > viewportHeight + 120) return;
      const progress =
        (rect.top + rect.height / 2 - viewportHeight / 2) /
        viewportHeight;
      element.style.setProperty("--parallax-y", `${progress * strength}px`);
    });

    sceneFrames.forEach(({ rect, lens, lanes }) => {
      if (rect.bottom < -160 || rect.top > viewportHeight + 160) return;
      const range = Math.max(rect.height - viewportHeight, 1);
      const progress = clamp(-rect.top / range);
      const lensProgress = clamp((progress - 0.12) / 0.58);
      const lensEased = 1 - Math.pow(1 - lensProgress, 3);

      lanes.forEach(({ lane, direction }) => {
        const travel = (progress - 0.5) * 250 * direction;
        lane.style.transform = `translate3d(${travel}px, 0, 0)`;
      });

      if (lens) {
        lens.style.opacity = String(0.28 + lensEased * 0.72);
        lens.style.transform = `translate3d(0, ${(1 - lensEased) * 42}px, 0) scale(${0.94 + lensEased * 0.06})`;
      }
    });

    bridgeFrames.forEach(({ rect, blur, shade, copy, phones }) => {
      if (rect.bottom < -160 || rect.top > viewportHeight + 160) return;

      const reveal = clamp(
        (viewportHeight * 0.68 - rect.top) / (viewportHeight * 0.5),
      );
      const revealEased = reveal * reveal * (3 - 2 * reveal);
      const blurReveal = clamp(
        (viewportHeight * 0.5 - rect.top) / (viewportHeight * 0.62),
      );
      const blurEased = blurReveal * blurReveal * (3 - 2 * blurReveal);
      const phoneProgress = clamp(
        (viewportHeight * 0.38 - rect.top) / (viewportHeight * 0.95),
      );

      if (blur) {
        blur.style.opacity = String(blurEased);
      }

      if (shade) {
        shade.style.opacity = String(0.18 + blurEased * 0.44);
      }

      if (copy) {
        copy.style.opacity = String(revealEased);
        copy.style.transform = `translate3d(-50%, ${(1 - revealEased) * 20}px, 0) scale(${0.95 + revealEased * 0.05})`;
      }

      phones.forEach(({ phone, enter, delay }) => {
        const localProgress = clamp(
          (phoneProgress - delay) / Math.max(1 - delay, 0.01),
        );
        const localEased = 1 - Math.pow(1 - localProgress, 3);
        phone.style.transform = `translate3d(0, ${enter * (1 - localEased)}px, 0)`;
      });
    });
  };

  const scheduleScrollMotion = () => {
    if (scrollRenderFrame) return;
    scrollRenderFrame = requestAnimationFrame(() => {
      scrollRenderFrame = 0;
      renderScrollMotion();
    });
  };

  const initSmoothScroll = () => {
    if (reduceMotion || !finePointer || typeof window.Lenis !== "function") {
      window.addEventListener("scroll", scheduleScrollMotion, { passive: true });
      renderScrollMotion();
      return;
    }

    lenis = new window.Lenis({
      lerp: 0.16,
      smoothWheel: true,
      wheelMultiplier: 0.96,
      touchMultiplier: 1,
      autoRaf: true,
    });

    lenis.on("scroll", scheduleScrollMotion);

    renderScrollMotion();
  };

  const animateNumber = (element, nextValue, suffix = "") => {
    if (!element) return;
    const previousValue = Number(element.dataset.value || 0);
    const duration = reduceMotion ? 1 : 900;
    const startedAt = performance.now();
    element.dataset.value = String(nextValue);

    const frame = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(previousValue + (nextValue - previousValue) * eased);
      element.textContent = `${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  };

  const initMagneticNavigation = () => {
    if (reduceMotion || !finePointer) return;

    document.querySelectorAll(".site-nav a").forEach((link) => {
      let pointerFrame = 0;
      let pointerX = 0;
      let pointerY = 0;

      link.addEventListener("pointermove", (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (pointerFrame) return;

        pointerFrame = requestAnimationFrame(() => {
          pointerFrame = 0;
          const rect = link.getBoundingClientRect();
          const x = ((pointerX - rect.left) / rect.width - 0.5) * 5;
          const y = ((pointerY - rect.top) / rect.height - 0.5) * 4;
          link.style.setProperty("--nav-shift-x", `${x}px`);
          link.style.setProperty("--nav-shift-y", `${y}px`);
        });
      });

      link.addEventListener("pointerleave", () => {
        if (pointerFrame) cancelAnimationFrame(pointerFrame);
        pointerFrame = 0;
        link.style.setProperty("--nav-shift-x", "0px");
        link.style.setProperty("--nav-shift-y", "0px");
      });
    });
  };

  const initPageMotion = () => {
    if (reduceMotion) return;

    const groups = [];
    const enter = (
      selector,
      triggerSelector,
      fromTransform = "translate3d(0, 22px, 0)",
      stagger = 0.065,
    ) => {
      const targets = [...document.querySelectorAll(selector)];
      if (!targets.length) return;

      groups.push({
        targets,
        trigger: triggerSelector
          ? document.querySelector(triggerSelector)
          : null,
        fromTransform,
        stagger,
      });
    };

    const page = body.dataset.page || "home";
    if (page === "home") {
      enter(".hero-index a", null, "translate3d(0, 18px, 0)", 0.075);
    }

    if (page === "health") {
      enter(".health-tab", ".analysis-frame", "translate3d(-18px, 0, 0)", 0.07);
      enter(
        ".analysis-panel.is-active .signal-row",
        ".analysis-frame",
        "translate3d(16px, 0, 0)",
        0.045,
      );
    }

    if (page === "nutrition") {
      enter(".food-item", ".nutrition-game", "translate3d(0, 18px, 0)", 0.055);
      enter(
        ".nutrition-table tr",
        ".nutrition-ledger",
        "translate3d(14px, 0, 0)",
        0.045,
      );
    }

    if (page === "training") {
      enter(
        ".constraint-ribbon span",
        ".training-tailor",
        "translate3d(0, 16px, 0)",
        0.06,
      );
      enter(".plan-steps li", ".plan-steps", "translate3d(18px, 0, 0)", 0.07);
    }

    if (page === "coach") {
      enter(".message", ".conversation", "translate3d(0, 18px, 0)", 0.085);
      enter(
        ".evidence-item",
        ".evidence-list",
        "translate3d(18px, 0, 0)",
        0.07,
      );
    }

    const play = ({ targets, fromTransform, stagger }) => {
      targets.forEach((target, index) => {
        const animation = target.animate(
          [
            { opacity: 0.28, transform: fromTransform },
            { opacity: 1, transform: "translate3d(0, 0, 0)" },
          ],
          {
            duration: 760,
            delay: Math.min(index * stagger * 1000, 420),
            easing: "cubic-bezier(.16,1,.3,1)",
            fill: "both",
          },
        );

        animation.finished
          .then(() => {
            target.style.opacity = "1";
            target.style.transform = "none";
            animation.cancel();
          })
          .catch(() => {});
      });
    };

    const triggeredGroups = groups.filter(({ trigger }) => trigger);
    groups
      .filter(({ trigger }) => !trigger)
      .forEach((group) => requestAnimationFrame(() => play(group)));

    if (!triggeredGroups.length) return;
    if (!("IntersectionObserver" in window)) {
      triggeredGroups.forEach(play);
      return;
    }

    const groupByTrigger = new Map(
      triggeredGroups.map((group) => [group.trigger, group]),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const group = groupByTrigger.get(entry.target);
          if (group) play(group);
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -18% 0px",
      },
    );

    triggeredGroups.forEach(({ trigger }) => observer.observe(trigger));
  };

  const initNutritionGame = () => {
    const game = document.querySelector("[data-nutrition-game]");
    if (!game) return;

    const foods = {
      chicken: { label: "Chicken", kcal: 310, protein: 48, carbs: 2, fat: 11, fiber: 0 },
      rice: { label: "Rice", kcal: 260, protein: 5, carbs: 56, fat: 1, fiber: 2 },
      greens: { label: "Greens", kcal: 90, protein: 4, carbs: 14, fat: 1, fiber: 7 },
      yogurt: { label: "Skyr", kcal: 170, protein: 20, carbs: 12, fat: 3, fiber: 0 },
      berries: { label: "Berries", kcal: 95, protein: 1, carbs: 21, fat: 0, fiber: 6 },
      avocado: { label: "Avocado", kcal: 190, protein: 3, carbs: 10, fat: 17, fiber: 8 },
    };

    const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const counts = new Map();
    const receiver = game.querySelector("[data-food-receiver]");
    const tray = game.querySelector("[data-meal-tray]");
    const emptyTray = game.querySelector("[data-empty-tray]");
    const reset = game.querySelector("[data-nutrition-reset]");
    const status = game.querySelector("[data-nutrition-status]");

    const scoreForTotals = () => {
      const diversity = Math.min(counts.size / 6, 1) * 28;
      const protein = Math.min(totals.protein / 120, 1) * 26;
      const fiber = Math.min(totals.fiber / 30, 1) * 22;
      const energy = Math.min(totals.kcal / 1900, 1) * 14;
      const balance = totals.carbs > 0 && totals.fat > 0 ? 10 : 0;
      return Math.min(100, Math.round(diversity + protein + fiber + energy + balance));
    };

    const flyToLedger = (source) => {
      if (reduceMotion || !receiver) return;
      const sourceRect = source.getBoundingClientRect();
      const targetRect = receiver.getBoundingClientRect();
      const clone = source.cloneNode(true);
      clone.classList.add("food-flight");
      clone.setAttribute("aria-hidden", "true");
      clone.style.width = `${sourceRect.width}px`;
      clone.style.height = `${sourceRect.height}px`;
      clone.style.left = `${sourceRect.left}px`;
      clone.style.top = `${sourceRect.top}px`;
      document.body.appendChild(clone);

      const deltaX = targetRect.left + targetRect.width * 0.58 - (sourceRect.left + sourceRect.width / 2);
      const deltaY = targetRect.top + targetRect.height * 0.42 - (sourceRect.top + sourceRect.height / 2);
      const animation = clone.animate(
        [
          { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1 },
          { transform: `translate3d(${deltaX * 0.52}px, ${deltaY * 0.32 - 36}px, 0) scale(.82)`, opacity: 0.92, offset: 0.52 },
          { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(.22)`, opacity: 0 },
        ],
        { duration: 720, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" },
      );
      animation.addEventListener("finish", () => clone.remove(), { once: true });
    };

    const renderTray = () => {
      if (!tray) return;
      tray.querySelectorAll("[data-tray-item]").forEach((item) => item.remove());
      if (emptyTray) emptyTray.hidden = counts.size > 0;

      counts.forEach((count, name) => {
        const food = foods[name];
        const item = document.createElement("span");
        item.className = "tray-item";
        item.dataset.trayItem = name;
        item.innerHTML = `<i aria-hidden="true"></i><span>${food.label}</span><strong>×${count}</strong>`;
        tray.appendChild(item);
      });
    };

    const renderTotals = () => {
      const score = scoreForTotals();
      animateNumber(game.querySelector("[data-score-value]"), score);
      animateNumber(game.querySelector("[data-kcal-value]"), totals.kcal);
      animateNumber(game.querySelector("[data-protein-value]"), totals.protein);
      animateNumber(game.querySelector("[data-carbs-value]"), totals.carbs);
      animateNumber(game.querySelector("[data-fat-value]"), totals.fat);
      animateNumber(game.querySelector("[data-fiber-value]"), totals.fiber);
      const scoreTrack = game.querySelector("[data-score-track]");
      if (scoreTrack) scoreTrack.style.transform = `scaleX(${score / 100})`;
      if (reset) reset.disabled = counts.size === 0;
      renderTray();
      return score;
    };

    game.querySelectorAll("[data-food-item]").forEach((button) => {
      button.addEventListener("click", () => {
        const name = button.dataset.foodItem;
        const food = foods[name];
        if (!food) return;

        flyToLedger(button);
        Object.keys(totals).forEach((key) => {
          totals[key] += food[key];
        });
        counts.set(name, (counts.get(name) || 0) + 1);
        button.dataset.count = String(counts.get(name));
        const score = renderTotals();
        if (status) status.textContent = `${food.label} added. Daily nutrition score is now ${score} out of 100.`;
        receiver?.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.012)", offset: 0.45 },
            { transform: "scale(1)" },
          ],
          { duration: 520, easing: "cubic-bezier(.16,1,.3,1)" },
        );
      });
    });

    reset?.addEventListener("click", () => {
      Object.keys(totals).forEach((key) => {
        totals[key] = 0;
      });
      counts.clear();
      game.querySelectorAll("[data-food-item]").forEach((button) => {
        delete button.dataset.count;
      });
      renderTotals();
      if (status) status.textContent = "Nutrition ledger reset to zero.";
    });
  };

  const initHealthTabs = () => {
    const tabs = [...document.querySelectorAll("[data-health-tab]")];
    const panels = [...document.querySelectorAll("[data-health-panel]")];
    if (!tabs.length || !panels.length) return;

    const select = (name) => {
      tabs.forEach((tab) => {
        const selected = tab.dataset.healthTab === name;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });

      panels.forEach((panel) => {
        const selected = panel.dataset.healthPanel === name;
        panel.classList.toggle("is-active", selected);
        panel.hidden = !selected;
        if (selected && !reduceMotion) {
          const animation = panel.animate(
            [
              { opacity: 0, transform: "translate3d(0, 18px, 0)" },
              { opacity: 1, transform: "translate3d(0, 0, 0)" },
            ],
            {
              duration: 460,
              easing: "cubic-bezier(.16,1,.3,1)",
              fill: "both",
            },
          );
          animation.finished
            .then(() => animation.cancel())
            .catch(() => {});
        }
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => select(tab.dataset.healthTab));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowRight", "ArrowLeft"].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (index + direction + tabs.length) % tabs.length;
        const next = tabs[nextIndex];
        select(next.dataset.healthTab);
        next.focus();
      });
    });
  };

  const initVideoControls = () => {
    document.querySelectorAll("[data-video-control]").forEach((button) => {
      const target = document.getElementById(button.getAttribute("aria-controls"));
      if (!(target instanceof HTMLVideoElement)) return;

      const syncLabel = () => {
        const paused = target.paused;
        button.textContent = paused ? "▶" : "Ⅱ";
        button.setAttribute("aria-label", paused ? "Play product video" : "Pause product video");
      };

      button.addEventListener("click", async () => {
        if (target.paused) {
          try {
            await target.play();
          } catch {
            return;
          }
        } else {
          target.pause();
        }
        syncLabel();
      });

      target.addEventListener("play", syncLabel);
      target.addEventListener("pause", syncLabel);
      syncLabel();
    });
  };

  const initHeroWarp = () => {
    const hero = document.querySelector(".hero");
    const canvas = hero?.querySelector("[data-hero-warp]");
    const readout = hero?.querySelector("[data-hero-signal-readout]");
    if (!hero || !canvas || reduceMotion || !finePointer) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;

      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision highp float;

      uniform vec2 u_resolution;
      uniform vec2 u_pointer;
      uniform float u_strength;
      varying vec2 v_uv;

      float lineMask(float value, float target, float width) {
        return 1.0 - smoothstep(width, width * 2.5, abs(value - target));
      }

      float softGrid(float value, float density) {
        float cell = abs(fract(value * density) - 0.5);
        return 1.0 - smoothstep(0.485, 0.5, cell);
      }

      vec3 heroScene(vec2 point) {
        float aspect = u_resolution.x / max(u_resolution.y, 1.0);
        float diagonal = clamp(point.x * 0.34 + point.y * 0.66, 0.0, 1.0);
        vec3 colour = mix(vec3(0.0196, 0.0275, 0.0431), vec3(0.0314, 0.0431, 0.0706), diagonal);

        vec2 blueDelta = (point - vec2(0.68, 0.28)) * vec2(aspect, 1.0);
        float blueGlow = 1.0 - smoothstep(0.0, 0.42, length(blueDelta));
        colour += vec3(0.0706, 0.1510, 0.3922) * blueGlow * 0.72;

        vec2 lowDelta = (point - vec2(0.28, 0.72)) * vec2(aspect, 1.0);
        float lowGlow = 1.0 - smoothstep(0.0, 0.46, length(lowDelta));
        colour += vec3(0.0353, 0.0824, 0.2039) * lowGlow * 0.56;

        vec2 arcDelta = (point - vec2(0.5, 0.035)) * vec2(aspect, 1.0);
        float arcDistance = length(arcDelta);
        float mainArc = 1.0 - smoothstep(0.0015, 0.004, abs(arcDistance - 0.735));
        float outerBand = exp(-pow((arcDistance - 0.865) / 0.085, 2.0));
        float farBand = exp(-pow((arcDistance - 1.005) / 0.105, 2.0));
        colour += vec3(0.1529, 0.2510, 0.5686) * mainArc * 0.14;
        colour += vec3(0.0745, 0.1451, 0.3529) * outerBand * 0.10;
        colour += vec3(0.0549, 0.1059, 0.2588) * farBand * 0.07;

        return colour;
      }

      void main() {
        float aspect = u_resolution.x / max(u_resolution.y, 1.0);
        vec2 point = vec2(v_uv.x, 1.0 - v_uv.y);
        vec2 lensSize = vec2(0.255, 0.205);
        vec2 delta = (point - u_pointer) * vec2(aspect, 1.0);
        vec2 local = delta / lensSize;

        // A softly squared optical aperture feels like an instrument, not a cursor halo.
        float apertureDistance = pow(
          pow(abs(local.x), 4.0) + pow(abs(local.y), 4.0),
          0.25
        );
        float aperture = (1.0 - smoothstep(0.92, 1.0, apertureDistance)) * u_strength;
        float apertureSoft = (1.0 - smoothstep(0.78, 1.08, apertureDistance)) * u_strength;
        float rim = (
          smoothstep(0.82, 0.94, apertureDistance) -
          smoothstep(0.94, 1.025, apertureDistance)
        ) * u_strength;
        float outerRim = (
          smoothstep(0.98, 1.025, apertureDistance) -
          smoothstep(1.025, 1.07, apertureDistance)
        ) * u_strength;

        // A small refraction at the aperture edge suggests a real optical layer.
        vec2 normal = normalize(local + vec2(0.0001));
        vec2 refractedPoint = point - normal * rim * 0.012 / vec2(aspect, 1.0);
        vec3 colour = heroScene(mix(point, refractedPoint, apertureSoft));

        // Raw signals exist outside the lens as a quiet, unresolved field.
        float rawA = lineMask(point.y, 0.31 + sin(point.x * 18.0) * 0.018, 0.018);
        float rawB = lineMask(point.y, 0.52 + sin(point.x * 12.0 + 1.4) * 0.024, 0.022);
        float rawC = lineMask(point.y, 0.71 + sin(point.x * 22.0 + 3.0) * 0.012, 0.016);
        colour += vec3(0.094, 0.157, 0.31) * (rawA + rawB + rawC) * 0.035;

        // Inside the lens, three health signals become calibrated and distinct.
        float lensGrid = (
          softGrid(local.x + 1.0, 4.0) +
          softGrid(local.y + 1.0, 3.0)
        ) * aperture;
        vec3 lensBase = mix(
          colour * 0.76,
          vec3(0.025, 0.047, 0.098),
          0.46
        );
        lensBase += vec3(0.075, 0.12, 0.24) * lensGrid * 0.26;

        float traceX = local.x;
        float sleepWave = -0.46 + sin(traceX * 4.5 + 0.8) * 0.075;
        float hrvWave = -0.02 + sin(traceX * 8.0) * 0.06 + sin(traceX * 2.5) * 0.035;
        float loadWave = 0.43 + sin(traceX * 5.2 + 2.1) * 0.052;
        float sleepTrace = lineMask(local.y, sleepWave, 0.012) * aperture;
        float hrvTrace = lineMask(local.y, hrvWave, 0.011) * aperture;
        float loadTrace = lineMask(local.y, loadWave, 0.012) * aperture;

        lensBase += vec3(0.38, 0.62, 1.0) * sleepTrace * 0.92;
        lensBase += vec3(0.43, 0.87, 0.58) * hrvTrace * 0.92;
        lensBase += vec3(0.94, 0.65, 0.28) * loadTrace * 0.88;

        // Sampling nodes turn decorative lines into a measured signal system.
        float samples = 0.0;
        for (int i = 0; i < 7; i++) {
          float sampleX = -0.78 + float(i) * 0.26;
          float sampleY = -0.02 + sin(sampleX * 8.0) * 0.06 + sin(sampleX * 2.5) * 0.035;
          float node = 1.0 - smoothstep(0.025, 0.047, length(local - vec2(sampleX, sampleY)));
          samples += node;
        }
        lensBase += vec3(0.72, 0.93, 0.78) * samples * aperture;

        colour = mix(colour, lensBase, apertureSoft * 0.96);
        colour += vec3(0.31, 0.51, 0.96) * rim * 0.42;
        colour += vec3(0.68, 0.78, 1.0) * outerRim * 0.22;

        // Four calibration corners keep the silhouette specific to Lihas analysis.
        float cornerX = smoothstep(0.72, 0.8, abs(local.x));
        float cornerY = smoothstep(0.72, 0.8, abs(local.y));
        float cornerMarks = cornerX * cornerY * (1.0 - smoothstep(0.96, 1.02, apertureDistance));
        colour += vec3(0.49, 0.68, 1.0) * cornerMarks * u_strength * 0.28;

        gl_FragColor = vec4(colour, 1.0);
      }
    `;

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    gl.useProgram(program);
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const pointerLocation = gl.getUniformLocation(program, "u_pointer");
    const strengthLocation = gl.getUniformLocation(program, "u_strength");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    let currentX = 0.66;
    let currentY = 0.42;
    let targetX = currentX;
    let targetY = currentY;
    let currentStrength = 0;
    let targetStrength = 0;
    let frame = 0;
    let heroBounds = hero.getBoundingClientRect();

    const resize = () => {
      const bounds = hero.getBoundingClientRect();
      heroBounds = bounds;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1);
      const width = Math.max(1, Math.round(bounds.width * pixelRatio));
      const height = Math.max(1, Math.round(bounds.height * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const draw = () => {
      resize();
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(pointerLocation, currentX, currentY);
      gl.uniform1f(strengthLocation, currentStrength);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const renderReadout = () => {
      if (!readout) return;

      const pointerX = currentX * heroBounds.width;
      const pointerY = currentY * heroBounds.height;
      const lensHeight = heroBounds.height * 0.205;
      const readoutWidth = 270;
      const left = clamp(pointerX - readoutWidth / 2, 24, heroBounds.width - readoutWidth - 24);
      const below = pointerY + lensHeight + 34;
      const above = pointerY - lensHeight - 60;
      const top = below > heroBounds.height - 70 ? above : below;

      readout.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
      readout.style.opacity = String(clamp((currentStrength - 0.12) / 0.72));
    };

    const render = () => {
      currentX += (targetX - currentX) * 0.13;
      currentY += (targetY - currentY) * 0.13;
      currentStrength += (targetStrength - currentStrength) * 0.11;
      draw();
      renderReadout();

      if (
        Math.abs(targetX - currentX) > 0.0002 ||
        Math.abs(targetY - currentY) > 0.0002 ||
        Math.abs(targetStrength - currentStrength) > 0.002
      ) {
        frame = window.requestAnimationFrame(render);
      } else {
        frame = 0;
      }
    };

    const scheduleRender = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const updateTarget = (event) => {
      const bounds = hero.getBoundingClientRect();
      targetX = clamp((event.clientX - bounds.left) / bounds.width);
      targetY = clamp((event.clientY - bounds.top) / bounds.height);
      targetStrength = 1;
      scheduleRender();
    };

    hero.addEventListener("pointerenter", updateTarget, { passive: true });
    hero.addEventListener("pointermove", updateTarget, { passive: true });
    hero.addEventListener("pointerleave", () => {
      targetStrength = 0;
      scheduleRender();
    }, { passive: true });

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => {
        heroBounds = hero.getBoundingClientRect();
        draw();
      });
      resizeObserver.observe(hero);
    } else {
      window.addEventListener("resize", () => {
        heroBounds = hero.getBoundingClientRect();
        draw();
      }, { passive: true });
    }

    draw();
    hero.classList.add("has-warp-canvas");
  };

  const initAppleSyncLive = () => {
    const section = document.querySelector("[data-apple-sync]");
    if (!section) return;

    const chartPath = section.querySelector("[data-live-chart-path]");
    const chartArea = section.querySelector("[data-live-chart-area]");
    const chartDot = section.querySelector("[data-live-chart-dot]");
    const chartHalo = section.querySelector("[data-live-chart-halo]");
    const chartStream = section.querySelector("[data-live-chart-stream]");
    const heartRate = section.querySelector("[data-live-heart-rate]");
    const fitnessMove = section.querySelector("[data-fitness-move]");
    const fitnessExercise = section.querySelector("[data-fitness-exercise]");
    const fitnessStand = section.querySelector("[data-fitness-stand]");
    if (!chartPath || !chartArea || !chartDot || !chartHalo || !chartStream || !heartRate) return;

    const pointCount = 34;
    const chartWidth = 640;
    const chartHeight = 250;
    const chartTop = 24;
    const chartBottom = 224;
    const minimum = 50;
    const maximum = 90;
    const values = Array.from({ length: pointCount }, (_, index) =>
      68 + Math.sin(index * 0.54) * 4 + Math.sin(index * 0.17) * 3
    );

    const toCoordinates = () =>
      values.map((value, index) => ({
        x: (index / (pointCount - 1)) * chartWidth,
        y: chartBottom - ((value - minimum) / (maximum - minimum)) * (chartBottom - chartTop),
      }));

    const makeSmoothPath = (points) => {
      if (!points.length) return "";
      let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
      for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const current = points[index];
        const midpoint = (previous.x + current.x) / 2;
        path += ` C ${midpoint.toFixed(2)} ${previous.y.toFixed(2)}, ${midpoint.toFixed(2)} ${current.y.toFixed(2)}, ${current.x.toFixed(2)} ${current.y.toFixed(2)}`;
      }
      return path;
    };

    const render = (animate = false) => {
      const points = toCoordinates();
      const line = makeSmoothPath(points);
      const last = points[points.length - 1];
      if (animate) {
        chartStream.style.transition = "none";
        chartStream.style.transform = `translate3d(${(chartWidth / (pointCount - 1)).toFixed(2)}px, 0, 0)`;
      }
      chartPath.setAttribute("d", line);
      chartArea.setAttribute("d", `${line} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`);
      chartDot.setAttribute("cx", last.x.toFixed(2));
      chartDot.setAttribute("cy", last.y.toFixed(2));
      chartHalo.setAttribute("cx", last.x.toFixed(2));
      chartHalo.setAttribute("cy", last.y.toFixed(2));
      heartRate.textContent = String(Math.round(values[values.length - 1]));

      if (animate) {
        window.requestAnimationFrame(() => {
          chartStream.style.transition = "transform 780ms cubic-bezier(0.22, 1, 0.36, 1)";
          chartStream.style.transform = "translate3d(0, 0, 0)";
        });
      }
    };

    render();
    if (reduceMotion) return;

    let sample = 0;
    let timer = 0;
    const addSample = () => {
      sample += 1;
      const previous = values[values.length - 1];
      const drift = Math.sin(sample * 0.72) * 2.8 + Math.sin(sample * 0.21) * 1.7;
      const next = clamp(previous * 0.54 + (71 + drift) * 0.46, 56, 86);
      values.push(next);
      values.shift();
      render(true);

      section.classList.remove("is-syncing");
      window.requestAnimationFrame(() => section.classList.add("is-syncing"));

      if (sample % 4 === 0 && fitnessMove) {
        fitnessMove.textContent = String(479 + Math.floor(sample / 4));
      }
      if (sample % 11 === 0 && fitnessExercise) {
        fitnessExercise.textContent = String(Math.min(30, 24 + Math.floor(sample / 11)));
      }
      if (sample % 17 === 0 && fitnessStand) {
        fitnessStand.textContent = String(Math.min(12, 6 + Math.floor(sample / 17)));
      }
    };

    const start = () => {
      if (!timer) timer = window.setInterval(addSample, 1100);
    };
    const stop = () => {
      window.clearInterval(timer);
      timer = 0;
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          start();
        } else {
          stop();
        }
      }, { rootMargin: "180px 0px" });
      observer.observe(section);
    } else {
      start();
    }
  };

  const initBrandMarquees = () => {
    document.querySelectorAll("[data-brand-marquee]").forEach((marquee) => {
      const track = marquee.querySelector(".brand-marquee-track");
      const set = track?.querySelector(".brand-marquee-set");
      if (!track || !set || track.children.length > 1) return;

      const duplicate = set.cloneNode(true);
      duplicate.setAttribute("aria-hidden", "true");
      track.appendChild(duplicate);
      marquee.classList.add("is-ready");
    });
  };

  const setYear = () => {
    document.querySelectorAll("[data-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });
  };

  activateCurrentNavigation();
  initReveals();
  initSmoothScroll();
  initPageMotion();
  initMagneticNavigation();
  initNutritionGame();
  initHealthTabs();
  initVideoControls();
  initHeroWarp();
  initAppleSyncLive();
  initBrandMarquees();
  setYear();
  window.addEventListener("resize", () => {
    scrollMotionTargets = null;
    scheduleScrollMotion();
  }, { passive: true });
})();
