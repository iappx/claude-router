<template>
  <button
    type="button"
    :class="cn(
      'w-full text-left rounded-lg border bg-card p-3 transition-colors hover:border-primary/60 hover:bg-accent/40',
      isDefault ? 'border-primary/40' : 'border-border'
    )"
    @click="$emit('select')"
  >
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="flex items-center gap-1.5">
          <h3 class="font-mono font-semibold text-sm text-card-foreground truncate">{{ label }}</h3>
          <span v-if="isDefault" class="shrink-0 rounded-full bg-primary/15 text-primary text-[10px] font-mono px-1.5 py-0.5">
            Default
          </span>
          <span v-else-if="!registered" class="shrink-0 rounded-full bg-secondary text-secondary-foreground text-[10px] font-mono px-1.5 py-0.5">
            Unregistered
          </span>
        </div>
        <p class="text-[11px] font-mono text-muted-foreground truncate mt-0.5">{{ profileDir }}</p>
      </div>
      <arrow-right-icon class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </div>
  </button>
</template>

<script lang="ts">
import { Component, Prop, VueBase } from '@i-app/vue-facing-di'
import { ArrowRight } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

@Component({
    components: { ArrowRightIcon: ArrowRight },
    emits: ['select'],
})
export default class RouterTargetCard extends VueBase {
    @Prop({ required: true })
    public readonly label: string

    @Prop({ required: true })
    public readonly profileDir: string

    @Prop({ required: false, default: false })
    public readonly isDefault: boolean

    @Prop({ required: false, default: true })
    public readonly registered: boolean

    public cn = cn
}
</script>
