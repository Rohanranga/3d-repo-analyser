'use client';

import NeuralBackground from "@/components/ui/flow-field-background";

export function FlowFieldBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <NeuralBackground
        color="#818cf8"
        trailOpacity={0.12}
        particleCount={500}
        speed={0.8}
      />
    </div>
  );
}
