// src/app/classification/page.tsx
export const metadata = {
  description: "Upload data and classify planets with AI.",
}

import ClassifierClient from "./ClassifierClient"

export default function ClassifierPage() {
  return <ClassifierClient />
}
