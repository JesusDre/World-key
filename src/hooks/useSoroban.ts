import { useContext } from "react";
import { SorobanContext } from "@/context/SorobanContext";

export function useSoroban() {
  const ctx = useContext(SorobanContext);
  if (!ctx) {
    throw new Error("useSoroban debe usarse dentro de SorobanProvider");
  }
  return ctx;
}
