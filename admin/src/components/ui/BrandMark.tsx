export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="12" fill="#2152FF" />
      <path
        d="M24 8.5l14 6.2v11.3c0 9.4-6.3 15.7-14 18.5-7.7-2.8-14-9.1-14-18.5V14.7L24 8.5z"
        fill="#0B1B4A"
      />
      <path
        d="M24 11.5l11 4.8V26c0 7.4-4.9 12.4-11 15.1-6.1-2.7-11-7.7-11-15.1V16.3l11-4.8z"
        fill="#9BB6FF"
      />
      <path d="M24 18v17.5c4.8-2.2 8.5-6.3 8.5-12.6v-2.3L24 18z" fill="#2152FF" />
      <path d="M20 25.2h8v1.8h-8zm0 3.6h8v1.8h-8z" fill="white" />
    </svg>
  )
}
