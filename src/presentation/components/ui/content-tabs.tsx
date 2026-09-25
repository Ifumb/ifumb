'use client'

import { useState, type ComponentProps } from 'react'
import { FormTabs } from './form-tabs'

export function ContentTabs({ tabs }: Pick<ComponentProps<typeof FormTabs>, 'tabs'>) {
  const [selected, setSelected] = useState(0)
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <FormTabs tabs={tabs} selected={selected} onSelect={setSelected} />
    </div>
  )
}
