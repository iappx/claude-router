<template>
  <base-dialog :open="open" title="Settings" @close="$emit('close')">
    <div class="space-y-1.5">
      <label class="block text-xs font-mono text-muted-foreground">Instances folder</label>
      <div class="flex items-center gap-2">
        <p class="flex-1 min-w-0 text-sm font-mono text-foreground break-all rounded-md bg-background border border-border px-3 py-2">
          {{ settingsStore.instancesRootDir || '…' }}
        </p>
        <button
          type="button"
          class="h-8 px-3 text-xs rounded-md bg-secondary text-secondary-foreground font-mono transition-colors hover:bg-accent/60 disabled:opacity-50 shrink-0"
          :disabled="picking"
          @click="onPick"
        >
          Choose folder…
        </button>
      </div>
      <p class="text-[11px] font-mono text-muted-foreground">
        New instances create their profile folder here. Existing instances keep their current folder.
      </p>
    </div>

    <div v-if="!settingsStore.isOnSystemDrive" class="flex gap-2 text-muted-foreground">
      <info-icon class="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <p class="text-[11px] font-mono">
        This folder isn't on your system drive. It works fine as long as the drive stays connected —
        just keep in mind removable or network drives can make launches fail if they're unavailable.
      </p>
    </div>

    <div class="space-y-1.5">
      <label class="block text-xs font-mono text-muted-foreground">Auto-select timeout (seconds)</label>
      <input
        v-model.number="timeoutInput"
        type="number"
        min="5"
        max="30"
        class="w-24 h-8 px-2 text-sm font-mono rounded-md bg-background border border-border text-foreground"
        @change="onTimeoutChange"
      >
      <p class="text-[11px] font-mono text-muted-foreground">
        How long the protocol router picker waits before routing a claude:// redirect to the default instance automatically (5–30s).
      </p>
    </div>

    <div class="space-y-1.5">
      <label class="block text-xs font-mono text-muted-foreground">claude:// protocol handler</label>
      <p class="text-[11px] font-mono text-muted-foreground">
        Claude Router registers itself as a candidate claude:// handler automatically. Claude Desktop is a
        packaged app that already claims claude:// itself, so Windows still needs your explicit choice
        before links actually launch Claude Router instead.
      </p>
      <button
        type="button"
        class="w-full h-8 px-3 text-xs rounded-md bg-secondary text-secondary-foreground font-mono transition-colors hover:bg-accent/60"
        @click="onOpenDefaultAppsSettings"
      >
        Open Windows default apps…
      </button>
      <p class="text-[11px] font-mono text-muted-foreground">
        In the settings page that opens, search for "CLAUDE" and set Claude Router as the default for it.
      </p>
    </div>

    <div class="flex justify-end pt-2">
      <button
        type="button"
        class="h-8 px-3 text-xs rounded-md bg-secondary text-secondary-foreground font-mono transition-colors hover:bg-accent/60"
        @click="$emit('close')"
      >
        Close
      </button>
    </div>
  </base-dialog>
</template>

<script lang="ts">
import { Component, Prop, VueBase, Watch } from '@i-app/vue-facing-di'
import { inject } from 'tsyringe'
import { Info } from 'lucide-vue-next'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { SettingsStore } from '@/store/modules/settings/SettingsStore'

@Component({
    components: { BaseDialog, InfoIcon: Info },
    emits: ['close'],
})
export default class SettingsDialog extends VueBase {
    @Prop({ required: true })
    public readonly open: boolean

    public picking = false
    public timeoutInput = 10

    constructor(
        @inject(SettingsStore) public readonly settingsStore: SettingsStore,
    ) {
        super()
    }

    @Watch('open')
    onOpenChanged(isOpen: boolean): void {
        if (!isOpen) return
        this.timeoutInput = this.settingsStore.autoSelectTimeoutSeconds
    }

    public async onPick(): Promise<void> {
        this.picking = true
        try {
            await this.settingsStore.pickInstancesRootDir()
        } finally {
            this.picking = false
        }
    }

    public async onTimeoutChange(): Promise<void> {
        await this.settingsStore.setAutoSelectTimeoutSeconds(this.timeoutInput)
        this.timeoutInput = this.settingsStore.autoSelectTimeoutSeconds
    }

    public async onOpenDefaultAppsSettings(): Promise<void> {
        await this.settingsStore.openDefaultAppsSettings()
    }
}
</script>
