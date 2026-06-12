export const colors = {
  ground: '#FBF7EF',
  ink: '#2A2A24',
  greenDeep: '#1F6B3B',
  greenSage: '#4D8B62',
  coral: '#FF7A4D',
  gold: '#F2B23E',
  sick: '#A0522D',
} as const

export const ripeness = {
  'Under Ripe': colors.greenDeep,
  'About to Ripe': colors.gold,
  'Ripe': colors.coral,
  'Sick Melon': colors.sick,
} as const
