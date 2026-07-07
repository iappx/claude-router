<template>
  <div :class="cn('flex items-center gap-2', props.class)">
    <div :class="cn('h-2 w-2 rounded-full', config.color)" />
    <span v-if="showLabel" class="text-xs font-mono text-muted-foreground">{{ config.label }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, VueBase } from '@i-app/vue-facing-di'
import { cn } from '@/lib/utils'

type Status = 'running' | 'active' | 'stopped' | 'unavailable' | 'error' | 'enabled' | 'disabled'

const statusConfig: Record<Status, { color: string; label: string }> = {
    running: { color: 'bg-success animate-pulse-dot', label: 'Running' },
    active: { color: 'bg-success animate-pulse-dot', label: 'Active' },
    enabled: { color: 'bg-success animate-pulse-dot', label: 'Enabled' },
    stopped: { color: 'bg-muted-foreground', label: 'Stopped' },
    disabled: { color: 'bg-muted-foreground', label: 'Disabled' },
    unavailable: { color: 'bg-warning', label: 'Unavailable' },
    error: { color: 'bg-destructive animate-pulse-dot', label: 'Error' },
}

@Component({})
export default class StatusIndicator extends VueBase {
    @Prop({ required: true })
    public readonly status: Status

    @Prop({ required: false, default: true })
    public readonly showLabel: boolean

    @Prop({ required: false })
    public readonly class?: string

    public cn = cn

    public get props() {
        return { class: this.class }
    }

    public get config() {
        return statusConfig[this.status] || statusConfig.stopped
    }
}
</script>
