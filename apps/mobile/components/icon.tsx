import * as Lucide from "lucide-react-native";
import { useCSSVariable } from "uniwind";

type Props = {
  name: string;
  size?: number;
  colorVar?: string;
  color?: string;
  strokeWidth?: number;
};

export function Icon({
  name,
  size = 20,
  colorVar = "--color-foreground",
  color,
  strokeWidth = 2,
}: Props) {
  const themeColor = useCSSVariable(colorVar) as string | undefined;
  const Component = (Lucide as unknown as Record<string, React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>>)[toPascal(name)];

  if (!Component) return null;
  return (
    <Component
      size={size}
      color={color ?? themeColor ?? "#111"}
      strokeWidth={strokeWidth}
    />
  );
}

function toPascal(kebab: string): string {
  return kebab
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}
