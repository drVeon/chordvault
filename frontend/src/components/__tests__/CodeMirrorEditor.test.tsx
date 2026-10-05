import { act, render } from '@testing-library/react';
import { EditorView } from '@codemirror/view';
import { undo, redo } from '@codemirror/commands';
import { CodeMirrorEditor } from '../CodeMirrorEditor';

function editor(container: HTMLElement) {
  return EditorView.findFromDOM(container.querySelector('.cm-editor')!)!;
}

it.each([false, true])('preserves edits, selection and undo when changing from darkMode=%s', (darkMode) => {
  const original = '[C]Amazing grace 奇異恩典';
  const changed = `${original}\n[G]How sweet the sound`;
  const onChange = vi.fn();
  const { container, rerender } = render(<CodeMirrorEditor value={original} onChange={onChange} darkMode={darkMode} />);
  const view = editor(container);
  act(() => view.dispatch({ changes: { from: original.length, insert: changed.slice(original.length) }, selection: { anchor: 3, head: 10 } }));
  rerender(<CodeMirrorEditor value={changed} onChange={onChange} darkMode={!darkMode} />);
  const current = editor(container);
  expect(current.state.facet(EditorView.darkTheme)).toBe(!darkMode);
  expect(current.state.doc.toString()).toBe(changed);
  expect(current.state.selection.main.anchor).toBe(3);
  expect(current.state.selection.main.head).toBe(10);
  expect(current).toBe(view);
  act(() => { expect(undo(current)).toBe(true); });
  expect(current.state.doc.toString()).toBe(original);
  act(() => { expect(redo(current)).toBe(true); });
  expect(current.state.doc.toString()).toBe(changed);
});

it('uses the latest callback and accepts external content without recreating the editor', () => {
  const oldChange = vi.fn();
  const newChange = vi.fn();
  const { container, rerender } = render(<CodeMirrorEditor value="[C]Grace" onChange={oldChange} darkMode={false} />);
  const view = editor(container);
  rerender(<CodeMirrorEditor value="[D]恩典" onChange={newChange} darkMode={false} />);
  expect(editor(container)).toBe(view);
  expect(view.state.doc.toString()).toBe('[D]恩典');
  act(() => view.dispatch({ changes: { from: view.state.doc.length, insert: '!' } }));
  expect(newChange).toHaveBeenLastCalledWith('[D]恩典!');
  expect(oldChange).not.toHaveBeenCalled();
});
