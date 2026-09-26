/** Keeps interactive story state instant while mirroring it to the Controls panel. */
import { useState, type ReactNode } from "react";

type Setters<TArgs, TName extends keyof TArgs> = { [Key in TName]: (nextValue: TArgs[Key]) => void };
type PendingValues<TArgs, TName extends keyof TArgs> = { [Key in TName]?: TArgs[Key][] };

/** Copies the live args out of the story args. */
function pickArgs<TArgs extends object, TName extends keyof TArgs>(
  args: TArgs,
  names: readonly TName[],
): Pick<TArgs, TName> {
  const picked = {} as Pick<TArgs, TName>;
  for (const name of names) picked[name] = args[name];
  return picked;
}

/**
 * Holds the named args as React state that changes on the same frame as the interaction, and
 * sends each change to Storybook's Controls in the background. Routing every keystroke or toggle
 * through `updateArgs` alone makes the canvas wait for a round trip to the manager, which drops
 * characters and delays menus. Echoes of values sent from here are ignored, so a late echo never
 * rewinds newer state; any other arg change (the Controls panel, a reset) replaces it.
 *
 * It is a component, not a hook: story functions may only call Storybook hooks (`useArgs`), and
 * Storybook recreates their state when args change, while this component's state persists.
 */
export function LiveArgs<TArgs extends object, TName extends keyof TArgs>({
  args,
  names,
  updateArgs,
  children,
}: {
  /** The story args received by `render`. */
  args: TArgs;
  /** Args that hold interactive values. */
  names: readonly TName[];
  /** The `updateArgs` returned by Storybook's `useArgs`. */
  updateArgs: (update: Partial<TArgs>) => void;
  /** Renders the story with the live values and their setters. */
  children: (values: Pick<TArgs, TName>, setters: Setters<TArgs, TName>) => ReactNode;
}) {
  const [values, setValues] = useState(() => pickArgs(args, names));
  const [receivedArgs, setReceivedArgs] = useState(() => pickArgs(args, names));
  const [pendingValues, setPendingValues] = useState<PendingValues<TArgs, TName>>({});

  // Reacts to arg changes during render, React's pattern for state derived from props.
  const changedNames = names.filter((name) => !Object.is(args[name], receivedArgs[name]));
  if (changedNames.length > 0) {
    const nextValues = { ...values };
    const nextPendingValues = { ...pendingValues };
    for (const name of changedNames) {
      const pending = pendingValues[name] ?? [];
      const echoIndex = pending.findIndex((pendingValue) => Object.is(pendingValue, args[name]));
      if (echoIndex >= 0) {
        nextPendingValues[name] = pending.slice(echoIndex + 1);
      } else {
        nextPendingValues[name] = [];
        nextValues[name] = args[name];
      }
    }
    setReceivedArgs(pickArgs(args, names));
    setPendingValues(nextPendingValues);
    setValues(nextValues);
  }

  const setters = {} as Setters<TArgs, TName>;
  for (const name of names) {
    setters[name] = (nextValue) => {
      setValues((currentValues) => ({ ...currentValues, [name]: nextValue }));
      setPendingValues((currentPending) => ({
        ...currentPending,
        [name]: [...(currentPending[name] ?? []), nextValue],
      }));
      const argUpdate: Partial<TArgs> = {};
      argUpdate[name] = nextValue;
      updateArgs(argUpdate);
    };
  }

  return children(values, setters);
}
