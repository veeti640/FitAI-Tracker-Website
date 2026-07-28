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
        (viewportHeight * 0.22 - rect.top) / (viewportHeight * 0.56),
      );
      const revealEased = reveal * reveal * (3 - 2 * reveal);
      const phoneProgress = clamp(
        (viewportHeight * 0.2 - rect.top) / (viewportHeight * 0.92),
      );

      if (blur) {
        blur.style.opacity = String(revealEased);
      }

      if (shade) {
        shade.style.opacity = String(0.18 + revealEased * 0.48);
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
      enter(".trace-node", ".theatre-stage", "translate3d(0, 16px, 0)", 0.12);
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
  setYear();
  window.addEventListener("resize", () => {
    scrollMotionTargets = null;
    scheduleScrollMotion();
  }, { passive: true });
})();
