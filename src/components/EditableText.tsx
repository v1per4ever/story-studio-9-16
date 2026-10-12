import React, { useRef, useLayoutEffect, useCallback } from 'react';

export interface EditableTextProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Robust contentEditable text component for React.
 * Prevents cursor jumping to index 0 on keystrokes by keeping DOM text intact
 * during user input and only reconciling from props when text differs externally.
 */
export const EditableText: React.FC<EditableTextProps> = ({
  as: Component = 'div',
  value = '',
  onChange,
  className,
  style,
  ...rest
}) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const isComposingRef = useRef(false);

  // Sync external prop updates to the DOM node without resetting cursor
  useLayoutEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    if (el.textContent !== value) {
      if (document.activeElement === el) {
        // Active editing element: retain user selection offset
        const selection = window.getSelection();
        let offset = 0;
        if (selection && selection.rangeCount > 0) {
          offset = selection.getRangeAt(0).startOffset;
        }

        el.textContent = value;

        try {
          const newRange = document.createRange();
          const targetNode = el.firstChild || el;
          const safeOffset = Math.min(offset, targetNode.textContent?.length || 0);
          newRange.setStart(targetNode, safeOffset);
          newRange.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(newRange);
        } catch {
          // Fallback if caret cannot be repositioned
        }
      } else {
        el.textContent = value;
      }
    }
  }, [value]);

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      elementRef.current = node;
      if (node && node.textContent !== value) {
        node.textContent = value;
      }
    },
    // We intentionally only run when node attaches or when initial value is provided
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    if (isComposingRef.current) return;
    const text = e.currentTarget.textContent || '';
    onChange(text);
  };

  return (
    <Component
      ref={setRef as any}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onCompositionStart={() => {
        isComposingRef.current = true;
      }}
      onCompositionEnd={(e) => {
        isComposingRef.current = false;
        onChange(e.currentTarget.textContent || '');
      }}
      className={className}
      style={style}
      {...rest}
    />
  );
};
