import type { Editor } from "@tiptap/react";
import type { Selection } from "@tiptap/pm/state";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import { findParentNode } from "@tiptap/core";

/**
 * Gets the bounding rectangle of the current selection in the editor.
 */
export function getSelectionBoundingRect(
  editor: Editor | null
): DOMRect | null {
  if (!editor) return null;

  const { state, view } = editor;
  const { selection } = state;

  if (selection.empty) {
    // For empty selection, use cursor position
    const coords = view.coordsAtPos(selection.from);
    return new DOMRect(coords.left, coords.top, 0, coords.bottom - coords.top);
  }

  // For non-empty selection, get coordinates for start and end
  const startCoords = view.coordsAtPos(selection.from);
  const endCoords = view.coordsAtPos(selection.to);

  const top = Math.min(startCoords.top, endCoords.top);
  const left = Math.min(startCoords.left, endCoords.left);
  const bottom = Math.max(startCoords.bottom, endCoords.bottom);
  const right = Math.max(startCoords.right, endCoords.right);

  return new DOMRect(left, top, right - left, bottom - top);
}

/**
 * Checks if the current selection is valid for showing floating elements.
 */
export function isSelectionValid(
  editor: Editor | null,
  selection?: Selection,
  excludedNodeTypes: string[] = ["imageUpload", "horizontalRule"]
): boolean {
  if (!editor) return false;

  const sel = selection || editor.state.selection;

  // Empty selection is not valid
  if (sel.empty) return false;

  // Check if selection is within excluded node types
  const parentNode = findParentNode((node) => {
    return excludedNodeTypes.includes(node.type.name);
  })(sel);

  if (parentNode) return false;

  // Check if selection is in code block
  const codeBlockParent = findParentNode((node) => {
    return node.type.name === "codeBlock";
  })(sel);

  if (codeBlockParent) return false;

  // Check if selection is in table cell
  const tableCellParent = findParentNode((node) => {
    return node.type.name === "tableCell" || node.type.name === "tableHeader";
  })(sel);

  if (tableCellParent) return false;

  return true;
}

/**
 * Checks if the current text selection is valid for editing.
 */
export function isTextSelectionValid(editor: Editor | null): boolean {
  if (!editor) return false;

  const { selection } = editor.state;

  // Empty selection is not valid
  if (selection.empty) return false;

  // Must be a text selection
  if (!(selection instanceof TextSelection)) return false;

  // Check if selection is in code block
  const codeBlockParent = findParentNode((node) => {
    return node.type.name === "codeBlock";
  })(selection);

  if (codeBlockParent) return false;

  // Check if it's a node selection
  if (selection instanceof NodeSelection) return false;

  return true;
}

/**
 * Checks if a DOM element is within the editor's DOM tree.
 */
export function isElementWithinEditor(
  editor: Editor | null,
  element: Node | null
): boolean {
  if (!editor || !element) return false;

  const editorElement = editor.view.dom;
  return editorElement.contains(element);
}
