import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { artifacts } from "./core/artifacts";
import {
  commitRoute,
  destination,
  home,
  parseRoute,
  routeHash,
} from "./core/navigation";
import { worlds } from "./core/worlds";
import { records } from "./content/records";
import { transitionFor } from "./core/transitions";
import type { ArtifactId, Journey, Route } from "./core/types";

const Scene = lazy(() => import("./scene/Scene"));
class RenderBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}
function SignalLab() {
  const [gate, setGate] = useState(true);
  const [branch, setBranch] = useState("A");
  const [result, setResult] = useState("Ready to send.");
  return (
    <div className="lab">
      <div className="circuit-diagram" aria-hidden="true">
        <span className="node">IN</span>
        <i />
        <span className={gate ? "node on" : "node"}>{gate ? "●" : "×"}</span>
        <i />
        <span className="node">{branch}</span>
      </div>
      <label className="switch">
        <input
          type="checkbox"
          checked={gate}
          onChange={(e) => {
            setGate(e.target.checked);
            setResult("Circuit changed. Send another pulse.");
          }}
        />{" "}
        Gate open
      </label>
      <fieldset>
        <legend>Output branch</legend>
        {["A", "B"].map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="branch"
              checked={branch === value}
              onChange={() => {
                setBranch(value);
                setResult("Circuit changed. Send another pulse.");
              }}
            />{" "}
            {value}
          </label>
        ))}
      </fieldset>
      <button
        className="primary"
        onClick={() =>
          setResult(
            gate
              ? `Pulse received at output ${branch}.`
              : "Pulse stopped at the closed gate.",
          )
        }
      >
        Send a pulse ↗
      </button>
      <p role="status">{result}</p>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  const [hover, setHover] = useState<string | null>(null);
  const [map, setMap] = useState(false);
  const [panel, setPanel] = useState<"cafe" | "signal" | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const reducedMotion = useReducedMotion();
  const world = worlds[route.world];
  const entryProgress = world.entries[route.entry] ?? 0;
  const [progressDisplay, setProgressDisplay] = useState(entryProgress);
  const progress = useRef(entryProgress);
  const journey = useRef<Journey | null>(null);
  const tween = useRef<gsap.core.Timeline | null>(null);
  const veil = useRef<HTMLDivElement>(null);
  const sceneArea = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const discoveriesRef = useRef<HTMLDetailsElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const touchGesture = useRef({ y: 0, moved: false });

  const cancel = useCallback(() => {
    tween.current?.kill();
    tween.current = null;
    journey.current = null;
    if (veil.current) {
      veil.current.style.opacity = "0";
      veil.current.style.pointerEvents = "none";
    }
    setBusy(false);
    setHover(null);
    document.body.style.cursor = "";
  }, []);
  useEffect(() => {
    const sync = () => {
      cancel();
      const next = parseRoute(location.hash);
      progress.current = worlds[next.world].entries[next.entry] ?? 0;
      setProgressDisplay(progress.current);
      setRoute(next);
      setPanel(null);
      setMap(false);
      discoveriesRef.current?.removeAttribute("open");
    };
    if (location.hash !== routeHash(parseRoute(location.hash)))
      history.replaceState(null, "", routeHash(parseRoute(location.hash)));
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    window.addEventListener("universe:navigate", sync);
    const contextLost = () => {
      cancel();
      setFailed(true);
    };
    window.addEventListener("universe:context-lost", contextLost);
    return () => {
      cancel();
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("universe:navigate", sync);
      window.removeEventListener("universe:context-lost", contextLost);
    };
  }, [cancel]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [route]);
  useEffect(() => {
    if (panel) {
      lastFocus.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    } else lastFocus.current?.focus({ preventScroll: true });
  }, [panel]);
  useEffect(() => {
    if (reducedMotion) cancel();
  }, [reducedMotion, cancel]);

  const step = useCallback(
    (amount: number) => {
      if (busy || panel || map) return;
      progress.current = Math.max(0, Math.min(1, progress.current + amount));
      setProgressDisplay(progress.current);
    },
    [busy, panel, map],
  );
  useEffect(() => {
    const surface = sceneArea.current;
    if (!surface) return;
    let startY: number | null = null;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      step(Math.max(-0.055, Math.min(0.055, e.deltaY * 0.00045)));
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        startY = e.clientY;
        touchGesture.current = { y: e.clientY, moved: false };
      }
    };
    const move = (e: PointerEvent) => {
      if (startY !== null && e.pointerType === "touch") {
        if (Math.abs(touchGesture.current.y - e.clientY) > 8)
          touchGesture.current.moved = true;
        step((startY - e.clientY) * 0.0015);
        startY = e.clientY;
      }
    };
    const up = () => {
      startY = null;
    };
    surface.addEventListener("wheel", wheel, { passive: false });
    surface.addEventListener("pointerdown", down);
    surface.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    surface.addEventListener("pointercancel", up);
    return () => {
      surface.removeEventListener("wheel", wheel);
      surface.removeEventListener("pointerdown", down);
      surface.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      surface.removeEventListener("pointercancel", up);
    };
  }, [step]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancel();
        setPanel(null);
        setMap(false);
        return;
      }
      if (
        (e.target as HTMLElement).closest(
          'button,input,select,textarea,a,summary,[role="dialog"]',
        )
      )
        return;
      if (
        ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(
          e.key,
        )
      ) {
        e.preventDefault();
        step(
          e.key === "Home"
            ? -1
            : e.key === "End"
              ? 1
              : ["ArrowDown", "PageDown"].includes(e.key)
                ? 0.07
                : -0.07,
        );
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [step, cancel]);

  const activate = useCallback(
    (id: ArtifactId) => {
      if (busy) return;
      const next = destination(route.world, id);
      if (!next) {
        if (id === "cafe" || id === "signal") setPanel(id);
        return;
      }
      if (reducedMotion || failed) {
        commitRoute(next);
        return;
      }
      const item = world.placements.find((p) => p.id === id);
      if (!item || !veil.current) return;
      setBusy(true);
      setHover(null);
      const transition = transitionFor(world, id);
      journey.current = {
        target: item.position,
        phase: 0,
        kind: transition.kind,
      };
      veil.current.style.background = transition.cover;
      veil.current.style.pointerEvents = "auto";
      const destinationModule = worlds[next.world].load();
      // Commit exactly once at the covered boundary. Route synchronization kills
      // this timeline before a separate emergence tween is installed.
      const tl = gsap.timeline();
      tween.current = tl;
      tl.to(journey.current, {
        phase: 1,
        duration: transition.duration,
        ease: "power2.inOut",
      })
        .to(veil.current, { opacity: 1, duration: 0.22 }, "-=0.22")
        .call(() => {
          void destinationModule
            .then(() => {
              if (tween.current !== tl || !journey.current) return;
              commitRoute(next);
              if (veil.current) {
                veil.current.style.opacity = "1";
                tween.current = gsap
                  .timeline({
                    onComplete: () => {
                      tween.current = null;
                    },
                  })
                  .to(veil.current, {
                    opacity: 0,
                    duration: 0.65,
                    onComplete: () => {
                      if (veil.current)
                        veil.current.style.pointerEvents = "none";
                    },
                  });
              }
            })
            .catch(() => {
              if (tween.current === tl) {
                cancel();
                setFailed(true);
                commitRoute(next);
              }
            });
        });
    },
    [busy, route.world, world, reducedMotion, failed, cancel],
  );

  const fallback = (
    <div className="fallback">
      <span className="eyebrow">A different way through</span>
      <h2>The worlds are still connected.</h2>
      <p>
        3D is unavailable here. Use the object index below to explore the same
        connections and try the signal laboratory.
      </p>
    </div>
  );
  const modalKey = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const items = [
      ...panelRef.current.querySelectorAll<HTMLElement>(
        'button,input,a,[tabindex="0"]',
      ),
    ];
    const first = items[0],
      last = items.at(-1);
    if (
      e.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === panelRef.current)
    ) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };
  return (
    <main
      className={`universe ${route.world}`}
      data-world={route.world}
      data-busy={busy}
    >
      <a
        className="skip"
        href="#discoveries"
        onClick={(event) => {
          event.preventDefault();
          const discoveries = discoveriesRef.current;
          if (!discoveries) return;
          discoveries.open = true;
          discoveries.querySelector<HTMLElement>(".discovery-list")?.focus();
        }}
      >
        Skip to objects
      </a>
      <div
        className="scene"
        ref={sceneArea}
        onClickCapture={(e) => {
          if (touchGesture.current.moved) {
            e.stopPropagation();
            touchGesture.current.moved = false;
          }
        }}
        aria-label={`${world.title}, interactive 3D environment`}
      >
        {failed ? (
          fallback
        ) : (
          <RenderBoundary fallback={fallback}>
            <Suspense
              fallback={
                <div className="loading" role="status">
                  Unfolding the landscape…
                </div>
              }
            >
              <Scene
                route={route}
                runtime={{
                  activate,
                  hover: setHover,
                  progress,
                  journey,
                  reducedMotion,
                }}
                fallback={fallback}
              />
            </Suspense>
          </RenderBoundary>
        )}
      </div>
      <header className="masthead">
        <a
          className="wordmark"
          href={routeHash(home)}
          onClick={(e) => {
            e.preventDefault();
            cancel();
            commitRoute(home);
          }}
          aria-label="Adrian's universe, trail entrance"
        >
          ad<span> / </span>universe<span className="tiny-star">✳</span>
        </a>
        <span className="edition">
          FIELDWORK <span>001 — AN OPEN EXPERIMENT</span>
        </span>
        <button
          className="text-button"
          aria-expanded={map}
          onClick={() => {
            cancel();
            setMap(!map);
          }}
        >
          Wayfinder <span aria-hidden="true">⌘</span>
        </button>
      </header>
      <div className="world-heading">
        <span className="eyebrow">
          {route.world === "trail"
            ? "01 / The outside"
            : route.world === "circuit"
              ? "02 / The inside"
              : "03 / The in-between"}
        </span>
        <h1 tabIndex={-1} ref={heading}>
          {world.title}
        </h1>
        <p>{world.subtitle}</p>
      </div>
      <div className="compass" aria-hidden="true">
        <span>N</span>
        <i>↑</i>
        <small>EXPLORE AT YOUR OWN PACE</small>
      </div>
      {route.world === "notebook" && (
        <div className="page-note">
          <span className="eyebrow">
            {route.entry === "copper"
              ? "Found between the circuits"
              : "Gathered along the path"}
          </span>
          <p>
            {route.entry === "copper"
              ? "Even the smallest worlds leave a trace."
              : "Take the long way. Notice the little things."}
          </p>
          <small>
            A prototype field note. Follow either keepsake to continue.
          </small>
        </div>
      )}
      <div className="hover-prompt" aria-live="polite">
        {hover && (
          <span>
            {hover} <b>↗</b>
          </span>
        )}
      </div>
      <footer className="trail-footer">
        <div className="journey-caption">
          <span className="route-mark">
            {route.world === "trail"
              ? "⌁"
              : route.world === "circuit"
                ? "⌘"
                : "≋"}
          </span>
          <div>
            <strong>
              {route.world === "trail"
                ? "Take a little detour."
                : route.world === "circuit"
                  ? "Follow your curiosity."
                  : "Keep a thread."}
            </strong>
            <span>
              {route.world === "trail"
                ? "The objects along the way are doors."
                : "There is always another way through."}
            </span>
          </div>
        </div>
        <div className="movement">
          <button
            aria-label="Move backward"
            disabled={busy || progressDisplay <= 0}
            onClick={() => step(-0.09)}
          >
            ↑
          </button>
          <span>
            {reducedMotion ? "STEP TO EXPLORE" : "SCROLL TO WANDER"}
            <i>
              <b style={{ width: `${progressDisplay * 100}%` }} />
            </i>
          </span>
          <button
            aria-label="Move forward"
            disabled={busy || progressDisplay >= 1}
            onClick={() => step(0.09)}
          >
            ↓
          </button>
        </div>
        <span className="prototype-stamp">
          PROCEDURAL WORLDS
          <br />
          PHASE 01 / PROTOTYPE
        </span>
      </footer>
      <details className="discoveries" id="discoveries" ref={discoveriesRef}>
        <summary>
          Objects nearby <span>＋</span>
        </summary>
        <div
          className="discovery-list"
          role="region"
          tabIndex={-1}
          aria-label="Objects in this world"
        >
          <p>Find these in the landscape, or open them here.</p>
          {world.placements.map((item) => (
            <button
              key={item.id}
              disabled={busy}
              onClick={() => activate(item.id)}
            >
              <span>{artifacts[item.id].name}</span>
              <small>
                {destination(route.world, item.id) ? "Enter ↗" : "Inspect ↗"}
              </small>
            </button>
          ))}
          <small>
            Scroll, ↑ / ↓, or drag vertically to travel. Move your pointer to
            look around. Escape cancels travel.
          </small>
        </div>
      </details>
      {map && (
        <aside className="wayfinder" aria-label="Recovery navigation">
          <div className="panel-top">
            <span className="eyebrow">Find your bearings</span>
            <button aria-label="Close wayfinder" onClick={() => setMap(false)}>
              ×
            </button>
          </div>
          <h2>A few connected places.</h2>
          <p>Every object is a possible beginning.</p>
          {Object.values(worlds).map((item, i) => (
            <button
              key={item.id}
              className="world-link"
              onClick={() => {
                cancel();
                commitRoute({
                  world: item.id,
                  entry: Object.keys(item.entries)[0],
                });
              }}
            >
              <small>0{i + 1}</small>
              <span>{item.title}</span>
              <span>↗</span>
            </button>
          ))}
          <p className="fine">
            Browser back and forward retrace your discoveries. This wayfinder is
            always here if you need it.
          </p>
        </aside>
      )}
      {panel && (
        <div className="modal-shade" onClick={() => setPanel(null)}>
          <section
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-title"
            className="object-panel"
            onKeyDown={modalKey}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-top">
              <span className="eyebrow">{records[panel].status}</span>
              <button aria-label="Close object" onClick={() => setPanel(null)}>
                ×
              </button>
            </div>
            <h2 id="panel-title">{records[panel].title}</h2>
            <p>{records[panel].text}</p>
            {panel === "signal" ? (
              <SignalLab />
            ) : (
              <div className="cafe-note">
                The lights are on.
                <br />
                Stay a little while.
              </div>
            )}
          </section>
        </div>
      )}
      <div ref={veil} className="transition-veil" aria-hidden="true" />
      <span className="sr-only" role="status">
        {busy
          ? "Travelling. Press Escape to cancel."
          : `You are in ${world.title}.`}
      </span>
    </main>
  );
}
