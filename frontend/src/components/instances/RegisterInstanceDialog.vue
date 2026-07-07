<template>
  <base-dialog :open="open" title="Register instance" @close="onClose">
    <form class="space-y-4" @submit.prevent="onSubmit">
      <div class="space-y-1.5">
        <label class="block text-xs font-mono text-muted-foreground" for="register-name">Name</label>
        <input
          id="register-name"
          v-model="name"
          type="text"
          class="w-full h-9 px-3 rounded-md bg-background border border-border text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          autofocus
        />
      </div>

      <div v-if="cachedIsDefault" class="flex gap-2 rounded-md border border-primary/30 bg-primary/10 p-3">
        <info-icon class="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p class="text-xs font-mono text-primary">
          This is the default Claude Desktop install — Windows manages its data specially, so it can't
          be registered in place. It must be moved into a Claude Router folder. Since its processes
          can't be isolated from other Claude windows, moving it will briefly close every running
          Claude instance (not just this one) to make sure it's fully stopped, then reopen it from its
          new location.
        </p>
      </div>

      <label v-else class="flex items-start gap-2 text-xs font-mono text-muted-foreground cursor-pointer">
        <input v-model="leaveHere" type="checkbox" class="mt-0.5 accent-primary" :disabled="busy" />
        Leave data where it is
      </label>

      <template v-if="!leaveHere">
        <div class="space-y-1.5">
          <label class="block text-xs font-mono text-muted-foreground" for="register-folder">Profile folder</label>
          <input
            id="register-folder"
            v-model="folderName"
            type="text"
            :disabled="busy"
            class="w-full h-9 px-3 rounded-md bg-background border border-border text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            @input="folderNameTouched = true"
          />
        </div>

        <div class="flex gap-2 rounded-md border border-warning/30 bg-warning/10 p-3">
          <alert-triangle-icon class="h-4 w-4 shrink-0 text-warning mt-0.5" />
          <p class="text-xs font-mono text-warning break-all">
            {{ cachedIsDefault ? 'Every running Claude instance will be closed and all files moved:' : 'The instance will be stopped and all files moved:' }}
            <br /><span class="text-muted-foreground">from</span> {{ cachedOldPath }}
            <br /><span class="text-muted-foreground">to</span> {{ newPathPreview }}
          </p>
        </div>

        <div v-if="conflict" class="space-y-2 rounded-md border border-warning/30 bg-warning/10 p-3">
          <div class="flex gap-2">
            <alert-triangle-icon class="h-4 w-4 shrink-0 text-warning mt-0.5" />
            <p class="text-xs font-mono text-warning break-all">
              Couldn't copy <span class="font-semibold">{{ conflict.file }}</span>: {{ conflict.reason }}
            </p>
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="h-7 px-3 text-xs rounded-md bg-secondary text-secondary-foreground font-mono transition-colors hover:bg-destructive/20 hover:text-destructive"
              @click="onAbortConflict"
            >
              Abort move
            </button>
            <button
              type="button"
              class="h-7 px-3 text-xs rounded-md bg-primary text-primary-foreground font-mono transition-colors hover:bg-primary/90"
              @click="onSkipConflict"
            >
              Skip this file
            </button>
          </div>
        </div>

        <div v-else-if="busy" class="space-y-1">
          <div class="h-1.5 w-full rounded bg-secondary overflow-hidden">
            <div class="h-full bg-primary transition-all" :style="{ width: progressPercent + '%' }" />
          </div>
          <div class="flex items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground">
            <span class="truncate" :title="currentFile || progressLabel">{{ currentFile || progressLabel }}</span>
            <span v-if="progressDetail" class="shrink-0">{{ progressDetail }}</span>
          </div>
        </div>
      </template>

      <p v-else class="text-[11px] font-mono text-muted-foreground break-all">
        Data stays at {{ cachedOldPath }}
      </p>

      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="h-8 px-3 text-xs rounded-md bg-secondary text-secondary-foreground font-mono transition-colors hover:bg-accent/60 disabled:opacity-50"
          :disabled="busy"
          @click="onClose"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="h-8 px-3 text-xs rounded-md bg-primary text-primary-foreground font-mono transition-colors hover:bg-primary/90 disabled:opacity-50"
          :disabled="!name.trim() || busy"
        >
          {{ busy ? 'Working…' : leaveHere ? 'Register' : 'Register & Move' }}
        </button>
      </div>
    </form>
  </base-dialog>
</template>

<script lang="ts">
import { Component, Prop, VueBase, Watch } from '@i-app/vue-facing-di'
import { inject } from 'tsyringe'
import { toast } from 'vue-sonner'
import { Events } from '@wailsio/runtime'
import { AlertTriangle, Info } from 'lucide-vue-next'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { InstanceStore } from '@/store/modules/instance/InstanceStore'
import { InstanceProcessService } from '@/application/services/instance-process.service'
import { SettingsStore } from '@/store/modules/settings/SettingsStore'
import { Slugifier } from '@/domain/support/Slugifier'
import { PathJoiner } from '@/domain/support/PathJoiner'
import { ByteFormatter } from '@/domain/support/ByteFormatter'

type MoveProgressPayload = {
    profileDir: string
    currentFile: string
    bytesDone: number
    bytesTotal: number
}

type MoveConflictPayload = {
    profileDir: string
    file: string
    reason: string
}

@Component({
    components: { BaseDialog, AlertTriangleIcon: AlertTriangle, InfoIcon: Info },
    emits: ['close'],
})
export default class RegisterInstanceDialog extends VueBase {
    @Prop({ required: true })
    public readonly open: boolean

    @Prop({ required: false })
    public readonly profileDir: string | null

    public name = ''
    public folderName = ''
    public folderNameTouched = false
    public leaveHere = true
    public busy = false
    public progressPercent = 0
    public progressLabel = ''
    public currentFile = ''
    public bytesDoneLabel = ''
    public bytesTotalLabel = ''
    public conflict: { file: string; reason: string } | null = null

    /**
     * Snapshotted from the live `running` list when the dialog opens, and
     * used for the rest of its lifetime instead of re-reading that list.
     * A failed move attempt stops the process — after that it no longer
     * appears in `running`, so re-deriving these on every render would make
     * a retry fail with "no longer running" even though we still know
     * exactly where its data is.
     */
    public cachedOldPath = ''
    public cachedIsDefault = false

    private unsubscribeProgress: (() => void) | null = null
    private unsubscribeConflict: (() => void) | null = null

    constructor(
        @inject(InstanceStore) public readonly instanceStore: InstanceStore,
        @inject(InstanceProcessService) private readonly processService: InstanceProcessService,
        @inject(SettingsStore) public readonly settingsStore: SettingsStore,
    ) {
        super()
    }

    @Watch('open')
    onOpenChanged(isOpen: boolean): void {
        if (!isOpen || !this.profileDir) return
        const running = this.instanceStore.running.find((r) => r.profileDir === this.profileDir)
        this.cachedOldPath = running?.path ?? ''
        this.cachedIsDefault = running?.isDefault ?? false

        this.name = Slugifier.toTitleCase(this.profileDir)
        this.folderName = this.profileDir
        this.folderNameTouched = false
        // The default install can never be left in place — force the move path.
        this.leaveHere = !this.cachedIsDefault
        this.busy = false
        this.progressPercent = 0
        this.progressLabel = ''
        this.currentFile = ''
        this.bytesDoneLabel = ''
        this.bytesTotalLabel = ''
        this.conflict = null
    }

    @Watch('name')
    onNameChanged(): void {
        if (!this.folderNameTouched) {
            this.folderName = Slugifier.toKebabCase(this.name)
        }
    }

    get newPathPreview(): string {
        const slug = Slugifier.toKebabCase(this.folderName || this.name)
        return slug ? PathJoiner.join(this.settingsStore.instancesRootDir, slug) : '…'
    }

    get progressDetail(): string {
        return this.bytesTotalLabel ? `${this.bytesDoneLabel} / ${this.bytesTotalLabel} · ${this.progressPercent}%` : ''
    }

    public onClose(): void {
        if (this.busy) return
        this.$emit('close')
    }

    public async onSkipConflict(): Promise<void> {
        if (!this.conflict) return
        this.conflict = null
        await this.processService.resolveMoveConflict('skip')
    }

    public async onAbortConflict(): Promise<void> {
        if (!this.conflict) return
        this.conflict = null
        await this.processService.resolveMoveConflict('abort')
    }

    public async onSubmit(): Promise<void> {
        const trimmedName = this.name.trim()
        if (!trimmedName || !this.profileDir) return

        if (this.leaveHere && !this.cachedIsDefault) {
            this.instanceStore.registerRunningInstance(this.profileDir, trimmedName)
            this.$emit('close')
            return
        }

        this.busy = true
        this.progressPercent = 0
        this.conflict = null
        this.progressLabel = this.cachedIsDefault ? 'Stopping all Claude instances…' : 'Stopping instance…'

        this.unsubscribeProgress = Events.On('instance:move-progress', (e) => {
            const data = e.data as MoveProgressPayload
            if (data.profileDir !== this.profileDir) return
            this.progressPercent = data.bytesTotal > 0 ? Math.round((data.bytesDone / data.bytesTotal) * 100) : 100
            this.currentFile = data.currentFile
            this.bytesDoneLabel = ByteFormatter.format(data.bytesDone)
            this.bytesTotalLabel = ByteFormatter.format(data.bytesTotal)
        })
        this.unsubscribeConflict = Events.On('instance:move-conflict', (e) => {
            const data = e.data as MoveConflictPayload
            if (data.profileDir !== this.profileDir) return
            this.conflict = { file: data.file, reason: data.reason }
        })

        try {
            if (this.cachedIsDefault) {
                await this.instanceStore.registerDefaultInstanceWithMove(this.profileDir, trimmedName, this.folderName, this.cachedOldPath)
            } else {
                await this.instanceStore.registerRunningInstanceWithMove(this.profileDir, trimmedName, this.folderName, this.cachedOldPath)
            }
            this.$emit('close')
        } catch (error) {
            toast.error(`Failed to register instance: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            this.busy = false
            this.conflict = null
            this.unsubscribeProgress?.()
            this.unsubscribeProgress = null
            this.unsubscribeConflict?.()
            this.unsubscribeConflict = null
        }
    }
}
</script>
