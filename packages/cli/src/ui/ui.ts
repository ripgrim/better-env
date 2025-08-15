import {
  TextRenderable,
  RGBA,
  FrameBufferRenderable,
  renderFontToFrameBuffer,
  BoxRenderable,
  SelectRenderable,
  type SelectOption,
  BorderStyle,
} from "@opentui/core";

// Colors
export const colors = {
  background: "#141414",
  primary: "#e2e8f0",
  secondary: "#94a3b8",
  muted: "#64748b",
  accent: "#ffff00",
  success: "#00ff00",
  error: "#ff0000",
  warning: "#ffaa00",
  info: "#00ffff",

  // Box colors
  boxBg: "#2a2a2a",
  boxBorder: "#404040",
  instructionsBg: "#151515",
  instructionsBorder: "#2a2a2a",

  // Select colors
  selectBg: "#141414",
  selectFocusedBg: "#141414",
  selectText: "#b0b0b0",
  selectFocusedText: "#fff",
  selectSelectedBg: "#141414",
  selectSelectedText: "#FC6969",
  selectDescriptionColor: "#707070",
  selectSelectedDescriptionColor: "#a0a0a0",

  // Input colors
  inputBg: "#1a1a1a",
  inputText: "#ffffff",
  inputPlaceholder: "#666666",
  inputCursor: "#ffff00",
};

// Common styles for SelectRenderable
export const selectStyles = {
  backgroundColor: colors.selectBg,
  focusedBackgroundColor: colors.selectFocusedBg,
  textColor: colors.selectText,
  focusedTextColor: colors.selectFocusedText,
  selectedBackgroundColor: colors.selectSelectedBg,
  selectedTextColor: colors.selectSelectedText,
  descriptionColor: colors.selectDescriptionColor,
  selectedDescriptionColor: colors.selectSelectedDescriptionColor,
  showScrollIndicator: true,
  wrapSelection: true,
  showDescription: true,
  zIndex: 15,
};

// ASCII Logo
export function createLogo(
  renderer: any,
  position: { left: number; top: number }
): TextRenderable {
  const asciiArt = `
 @@@@@@@  @@@@@@@@ @@@@@@@ @@@@@@@ @@@@@@@@ @@@@@@@      @@@@@@@@ @@@  @@@ @@@  @@@
 @@!  @@@ @@!        @@!     @@!   @@!      @@!  @@@     @@!      @@!@!@@@ @@!  @@@
 @!@!@!@  @!!!:!     @!!     @!!   @!!!:!   @!@!!@!      @!!!:!   @!@@!!@! @!@  !@!
 !!:  !!! !!:        !!:     !!:   !!:      !!: :!!      !!:      !!:  !!!  !: .:! 
 :: : ::  : :: :::    :       :    : :: :::  :   : :     : :: ::: ::    :     ::   
                                                                                   
`.trim();

  return new TextRenderable("ascii-logo", {
    content: asciiArt,
    positionType: "absolute",
    position,
    fg: "#ff6b6b", // Nice red color
    bg: "transparent",
    zIndex: 20,
  });
}

// Common box creator
export function createBox(
  id: string,
  title: string,
  position: { left: number; top: number },
  size: { width: number; height: number },
  options: Partial<{
    bg: string;
    borderStyle: string;
    borderColor: string;
    titleAlignment: string;
    zIndex: number;
  }> = {}
): BoxRenderable {
  return new BoxRenderable(id, {
    positionType: "absolute",
    position,
    width: size.width,
    height: size.height,
    bg: options.bg || colors.boxBg,
    borderStyle: (options.borderStyle as BorderStyle) || "rounded",
    borderColor: options.borderColor || colors.boxBorder,
    title,
    titleAlignment:
      (options.titleAlignment as "center" | "left" | "right" | undefined) ||
      "center",
    zIndex: options.zIndex || 10,
  });
}

// Common select creator
export function createSelect(
  id: string,
  options: SelectOption[],
  position: { left: number; top: number },
  size: { width: number; height: number }
): SelectRenderable {
  return new SelectRenderable(id, {
    positionType: "absolute",
    position,
    width: size.width,
    height: size.height,
    options,
    ...selectStyles,
  });
}

// Common text creator
export function createText(
  id: string,
  content: string,
  position: { left: number; top: number },
  options: Partial<{
    fg: string;
    bg: string;
    zIndex: number;
  }> = {}
): TextRenderable {
  return new TextRenderable(id, {
    content,
    positionType: "absolute",
    position,
    fg: options.fg || colors.primary,
    bg: options.bg || "transparent",
    zIndex: options.zIndex || 20,
  });
}

// Center calculation helpers
export function centerX(renderer: any, width: number): number {
  return Math.floor((renderer.terminalWidth - width) / 2);
}

export function centerY(renderer: any, height: number): number {
  return Math.floor((renderer.terminalHeight - height) / 2);
}

// Control text
export const controlsText = "↑↓: Navigate | Enter: Select | Esc: Back";
