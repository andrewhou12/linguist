import { SegmentedControl } from '@radix-ui/themes'

export type FrontierView = 'levels' | 'map' | 'skills'

interface ViewToggleProps {
  value: FrontierView
  onChange: (value: FrontierView) => void
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <SegmentedControl.Root
      value={value}
      onValueChange={(v) => onChange(v as FrontierView)}
      size="1"
    >
      <SegmentedControl.Item value="levels">Levels</SegmentedControl.Item>
      <SegmentedControl.Item value="map">Map</SegmentedControl.Item>
      <SegmentedControl.Item value="skills">Skills</SegmentedControl.Item>
    </SegmentedControl.Root>
  )
}
