<template>
  <div
    :class="cn(
      'rounded-lg border bg-card p-4 transition-colors',
      isDefault ? 'border-primary/40 glow-primary' : 'border-success/20 glow-primary'
    )"
  >
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2 min-w-0">
        <h3 class="font-mono font-semibold text-sm text-card-foreground truncate">{{ name }}</h3>
        <span
          v-if="isDefault"
          class="shrink-0 rounded-full bg-primary/15 text-primary text-[10px] font-mono px-1.5 py-0.5"
        >
          Default
        </span>
      </div>
      <status-indicator status="running" />
    </div>

    <dl class="space-y-1 mb-4">
      <div class="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
        <folder-icon class="h-3 w-3 shrink-0" />
        <span class="truncate">{{ profileDir }}</span>
      </div>
      <div class="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
        <eye-off-icon class="h-3 w-3 shrink-0" />
        <span>Not managed by Claude Router</span>
      </div>
      <div v-if="isDefault" class="flex items-center gap-1.5 text-xs font-mono text-primary">
        <info-icon class="h-3 w-3 shrink-0" />
        <span>Default install — special rules apply</span>
      </div>
    </dl>

    <div class="flex flex-col gap-1.5">
      <button
        class="h-7 text-xs rounded-md bg-secondary text-secondary-foreground flex items-center justify-center gap-1 font-mono transition-colors hover:bg-destructive/20 hover:text-destructive"
        @click="$emit('stop', profileDir)"
      >
        <square-icon class="h-3 w-3" /> Stop
      </button>

      <div class="flex gap-1.5">
        <button
          class="h-7 flex-1 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center transition-colors hover:bg-accent/60"
          aria-label="Open profile folder"
          title="Open folder"
          @click="$emit('open-folder', profileDir)"
        >
          <folder-open-icon class="h-3 w-3" />
        </button>
        <button
          class="h-7 flex-[2] rounded-md bg-primary text-primary-foreground flex items-center justify-center gap-1 font-mono transition-colors hover:bg-primary/90"
          @click="$emit('register', profileDir)"
        >
          <user-plus-icon class="h-3 w-3" /> Register
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, VueBase } from '@i-app/vue-facing-di'
import { Square, FolderOpen, UserPlus, Folder, EyeOff, Info } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import StatusIndicator from '@/components/common/StatusIndicator.vue'

@Component({
    components: {
        StatusIndicator,
        SquareIcon: Square,
        FolderOpenIcon: FolderOpen,
        UserPlusIcon: UserPlus,
        FolderIcon: Folder,
        EyeOffIcon: EyeOff,
        InfoIcon: Info,
    },
    emits: ['stop', 'open-folder', 'register'],
})
export default class DiscoveredInstanceCard extends VueBase {
    @Prop({ required: true })
    public readonly profileDir: string

    @Prop({ required: true })
    public readonly name: string

    @Prop({ required: false, default: false })
    public readonly isDefault: boolean

    public cn = cn
}
</script>
