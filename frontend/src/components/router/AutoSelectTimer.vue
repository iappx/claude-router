<template>
  <div class="relative h-9 w-9 shrink-0">
    <svg viewBox="0 0 36 36" class="h-9 w-9 -rotate-90">
      <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" class="text-secondary" stroke-width="3" />
      <motion-circle
        cx="18"
        cy="18"
        r="16"
        fill="none"
        stroke="currentColor"
        class="text-primary"
        stroke-width="3"
        stroke-linecap="round"
        :style="{ strokeDasharray: circumference }"
        :animate="{ strokeDashoffset }"
        :transition="{ duration: 0.4, ease: 'linear' }"
      />
    </svg>
    <span class="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-foreground">{{ seconds }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, VueBase } from '@i-app/vue-facing-di'
import { motion } from 'motion-v'

const RADIUS = 16
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

@Component({
    components: { MotionCircle: motion.circle },
})
export default class AutoSelectTimer extends VueBase {
    @Prop({ required: true })
    public readonly seconds: number

    @Prop({ required: true })
    public readonly total: number

    public readonly circumference = CIRCUMFERENCE

    get strokeDashoffset(): number {
        const ratio = this.total > 0 ? this.seconds / this.total : 0
        return this.circumference * (1 - ratio)
    }
}
</script>
