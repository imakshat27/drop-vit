'use client';
import { useEffect, useRef, useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

type Option = { value: string; label: string };
/** One visual and interaction pattern for edition pickers and editorial forms. */
export function DropSelect({
  id,
  name,
  options,
  defaultValue,
  disabled = false,
}: {
  id: string;
  name: string;
  options: Option[];
  defaultValue?: string;
  disabled?: boolean;
}) {
  const initial = defaultValue ?? options[0]?.value;
  const [value, setValue] = useState(initial);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const form = trigger.current?.form;
    const reset = (event: Event) => {
      queueMicrotask(() => {
        if (!event.defaultPrevented) setValue(initial);
      });
    };
    form?.addEventListener('reset', reset);
    return () => form?.removeEventListener('reset', reset);
  }, [initial]);
  return (
    <Select.Root
      name={name}
      value={value}
      onValueChange={setValue}
      disabled={disabled || !options.length}
    >
      <Select.Trigger ref={trigger} id={id} className="drop-select-trigger">
        <Select.Value placeholder="No options available">
          {options.find((option) => option.value === value)?.label}
        </Select.Value>
        <Select.Icon className="drop-select-chevron">
          <ChevronDown size={18} aria-hidden />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="drop-select-menu"
          position="popper"
          sideOffset={8}
          collisionPadding={16}
        >
          <Select.ScrollUpButton className="drop-select-scroll">
            <ChevronUp size={18} aria-hidden />
          </Select.ScrollUpButton>
          <Select.Viewport
            className="drop-select-viewport"
            tabIndex={0}
            role="group"
            aria-label="Available options"
          >
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                textValue={option.label}
                className="drop-select-option"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="drop-select-check">
                  <Check size={18} aria-hidden />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="drop-select-scroll">
            <ChevronDown size={18} aria-hidden />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
