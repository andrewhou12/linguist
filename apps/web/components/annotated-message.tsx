'use client'

import { Flex, Badge } from '@radix-ui/themes'
import { Check, X, AlertTriangle } from 'lucide-react'

export interface Annotation {
  type: 'target_hit' | 'error' | 'avoidance'
  label: string
}

interface AnnotatedMessageProps {
  children: React.ReactNode
  annotations: Annotation[]
}

export function AnnotatedMessage({ children, annotations }: AnnotatedMessageProps) {
  return (
    <div>
      {children}
      {annotations.length > 0 && (
        <Flex gap="2" mt="1" wrap="wrap">
          {annotations.map((ann, i) => {
            if (ann.type === 'target_hit') {
              return (
                <Badge key={i} size="1" variant="soft" color="green">
                  <Check size={10} />
                  {ann.label}
                </Badge>
              )
            }
            if (ann.type === 'error') {
              return (
                <Badge key={i} size="1" variant="soft" color="red">
                  <X size={10} />
                  {ann.label}
                </Badge>
              )
            }
            return (
              <Badge key={i} size="1" variant="soft" color="amber">
                <AlertTriangle size={10} />
                {ann.label}
              </Badge>
            )
          })}
        </Flex>
      )}
    </div>
  )
}
