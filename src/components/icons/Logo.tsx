import * as React from 'react';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 13V9a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      <path d="m11.5 13.5-2 2 2 2" />
      <path d="m14.5 13.5 2 2-2 2" />
      <path d="M18 19V6.5a2.5 2.5 0 0 0-5 0V19" />
      <path d="M13 6.5a2.5 2.5 0 0 1 5 0V19" />
      <path d="M6 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" />
    </svg>
  );
}
