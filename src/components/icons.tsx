// Small hand-rolled icon set.
//
// We used to pull these four icons from lucide-react, but its barrel file
// (lucide-react.mjs) can end up out of sync with the individual icon files
// it re-exports if the install gets interrupted or a cache is stale —
// that's what caused the "Can't resolve './icons/mouse-right.mjs'" build
// error. Since we only need four simple icons, inlining them removes an
// external dependency (and that whole class of bug) entirely.

import * as React from "react"

type IconProps = React.SVGProps<SVGSVGElement>

const base: IconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
}

export function Upload({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M12 16V4" />
      <path d="M6.5 9.5 12 4l5.5 5.5" />
      <path d="M4 16.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5" />
    </svg>
  )
}

export function FileText({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
      <path d="M8 9h2" />
    </svg>
  )
}

export function Sparkles({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="m5.6 5.6 2.8 2.8" />
      <path d="m15.6 15.6 2.8 2.8" />
      <path d="m18.4 5.6-2.8 2.8" />
      <path d="m8.4 15.6-2.8 2.8" />
    </svg>
  )
}

export function Loader2({ className, ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M21 12a9 9 0 1 1-9-9" />
    </svg>
  )
}
