import { useEffect, useMemo, useState } from "react";

interface Options {
  id: string;
  selector: string;
  position?: "append" | "prepend";
}

export function useCreatePortalContainer({ id, selector, position = "append" }: Options) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const ensure = useMemo(() => {
    return () => {
      const host = document.querySelector(selector) as HTMLElement | null;
      if (!host) return null;

      let el = host.querySelector(`#${id}`) as HTMLElement | null;
      if (!el) {
        el = document.createElement("div");
        el.id = id;
        if (position === "append") host.appendChild(el);
        else host.prepend(el);
      }
      return el;
    };
  }, [id, selector, position]);

  useEffect(() => {
    const el = ensure();
    setContainer(el);

    const observer = new MutationObserver(() => {
      const el = ensure();
      if (el && container !== el) setContainer(el);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [ensure]);

  return container;
}
