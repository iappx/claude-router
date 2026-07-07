<template>
  <div
    :class="cn(
      'rounded-lg border bg-card p-4 transition-colors',
      running ? 'border-success/20 glow-primary' : 'border-border hover:border-primary/30'
    )"
  >
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-mono font-semibold text-sm text-card-foreground truncate">{{ instance.name }}</h3>
      <status-indicator :status="running ? 'running' : 'stopped'" />
    </div>

    <dl class="space-y-1 mb-4">
      <div class="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
        <folder-icon class="h-3 w-3 shrink-0" />
        <span class="truncate">{{ instance.profileDir }}</span>
      </div>
      <div class="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
        <clock-icon class="h-3 w-3 shrink-0" />
        <span>{{ createdLabel }}</span>
      </div>
    </dl>

    <div class="flex flex-col gap-1.5">
      <button
        v-if="running"
        class="h-7 text-xs rounded-md bg-secondary text-secondary-foreground flex items-center justify-center gap-1 font-mono transition-colors hover:bg-destructive/20 hover:text-destructive"
        @click="$emit('stop', instance.id)"
      >
        <square-icon class="h-3 w-3" /> Stop
      </button>
      <button
        v-else
        class="h-7 text-xs rounded-md bg-primary text-primary-foreground flex items-center justify-center gap-1 font-mono transition-colors hover:bg-primary/90"
        @click="$emit('launch', instance.id)"
      >
        <play-icon class="h-3 w-3" /> Launch
      </button>

      <div class="flex gap-1.5">
        <button
          class="h-7 flex-1 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center transition-colors hover:bg-accent/60"
          aria-label="Rename instance"
          title="Rename"
          @click="$emit('edit', instance.id)"
        >
          <pencil-icon class="h-3 w-3" />
        </button>
        <button
          class="h-7 flex-1 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center transition-colors hover:bg-accent/60"
          aria-label="Open profile folder"
          title="Open folder"
          @click="$emit('open-folder', instance.id)"
        >
          <folder-open-icon class="h-3 w-3" />
        </button>
        <button
          class="h-7 flex-1 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center transition-colors hover:bg-destructive/20 hover:text-destructive disabled:opacity-50 disabled:hover:bg-secondary disabled:hover:text-secondary-foreground"
          aria-label="Remove instance"
          :title="running ? 'Stop the instance first' : 'Remove'"
          :disabled="running"
          @click="$emit('remove', instance.id)"
        >
          <trash-icon class="h-3 w-3" />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, VueBase } from '@i-app/vue-facing-di'
import { Play, Square, Pencil, FolderOpen, Trash2, Folder, Clock } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { InstanceModel } from '@/domain/models/instance'
import StatusIndicator from '@/components/common/StatusIndicator.vue'

@Component({
    components: {
        StatusIndicator,
        PlayIcon: Play,
        SquareIcon: Square,
        PencilIcon: Pencil,
        FolderOpenIcon: FolderOpen,
        TrashIcon: Trash2,
        FolderIcon: Folder,
        ClockIcon: Clock,
    },
    emits: ['launch', 'stop', 'edit', 'open-folder', 'remove'],
})
export default class InstanceCard extends VueBase {
    @Prop({ required: true })
    public readonly instance: InstanceModel

    @Prop({ required: false, default: false })
    public readonly running: boolean

    public cn = cn

    get createdLabel(): string {
        return new Date(this.instance.createdAt).toLocaleString()
    }
}
</script>
