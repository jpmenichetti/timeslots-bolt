interface TimeSlotIconProps {
  className?: string;
}

export function TimeSlotIcon({ className = "w-8 h-8" }: TimeSlotIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="30" fill="#F97316" stroke="#C2410C" strokeWidth="2"/>
      <circle cx="32" cy="32" r="20" fill="white" stroke="#C2410C" strokeWidth="2"/>
      <circle cx="32" cy="32" r="2" fill="#C2410C"/>
      <line x1="32" y1="32" x2="44" y2="32" stroke="#C2410C" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="32" y1="32" x2="32" y2="18" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
      <line x1="32" y1="14" x2="32" y2="17" stroke="#94A3B8" strokeWidth="1.5"/>
      <line x1="50" y1="32" x2="47" y2="32" stroke="#94A3B8" strokeWidth="1.5"/>
      <line x1="32" y1="50" x2="32" y2="47" stroke="#94A3B8" strokeWidth="1.5"/>
      <line x1="14" y1="32" x2="17" y2="32" stroke="#94A3B8" strokeWidth="1.5"/>
    </svg>
  );
}
