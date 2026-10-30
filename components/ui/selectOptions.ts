import { Children, isValidElement } from "react";

export type SelectOption = { value: string; label: string; disabled: boolean; action: boolean };

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

export function collectOptions(children: React.ReactNode, out: SelectOption[] = []): SelectOption[] {
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: React.ReactNode }>(child)) return;
    if (child.type === "option") {
      const label = textOf(child.props.children);
      const value = String(child.props.value ?? label);
      // "+ Add new …" entries open a creation flow — styled as actions, not choices.
      out.push({ value, label, disabled: !!child.props.disabled, action: value.startsWith("__") || label.startsWith("+") });
    } else {
      collectOptions(child.props.children, out);
    }
  });
  return out;
}
