import { Briefcase, GraduationCap, Globe, HeartPulse, Leaf, Shield, Tag, type LucideProps } from 'lucide-react'

const icons = {
  briefcase: Briefcase,
  'heart-pulse': HeartPulse,
  leaf: Leaf,
  'graduation-cap': GraduationCap,
  shield: Shield,
  globe: Globe,
}

export function ThemeIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = icons[name as keyof typeof icons] ?? Tag
  return <Icon aria-hidden="true" {...props} />
}
