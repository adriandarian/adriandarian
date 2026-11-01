import { createContext, useContext, useState, type ReactNode } from "react";
function useLab() {
  const [gate, setGate] = useState(true),
    [branch, setBranch] = useState("A"),
    [result, setResult] = useState("Ready to send."),
    [pulse, setPulse] = useState(0);
  return {
    gate,
    branch,
    result,
    pulse,
    setGate: (v: boolean) => {
      setGate(v);
      setPulse(0);
      setResult("Circuit changed. Send another pulse.");
    },
    setBranch: (v: string) => {
      setBranch(v);
      setPulse(0);
      setResult("Circuit changed. Send another pulse.");
    },
    send: () => {
      setPulse((p) => p + 1);
      setResult(
        gate
          ? `Pulse received at output ${branch}.`
          : "Pulse stopped at the closed gate.",
      );
    },
  };
}
const Context = createContext<ReturnType<typeof useLab> | null>(null);
export function SignalProvider({ children }: { children: ReactNode }) {
  const lab = useLab();
  return <Context.Provider value={lab}>{children}</Context.Provider>;
}
export function useSignal() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing signal laboratory");
  return value;
}
