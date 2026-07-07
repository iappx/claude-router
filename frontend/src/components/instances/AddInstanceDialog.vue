<template>
  <base-dialog :open="open" title="New instance" @close="onClose">
    <form class="space-y-4" @submit.prevent="onSubmit">
      <div class="space-y-1.5">
        <label class="block text-xs font-mono text-muted-foreground" for="instance-name">Name</label>
        <input
          id="instance-name"
          v-model="name"
          type="text"
          placeholder="e.g. Work, Personal, Client Acme"
          class="w-full h-9 px-3 rounded-md bg-background border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          autofocus
        />
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs font-mono text-muted-foreground" for="instance-profile-dir">Profile folder</label>
        <input
          id="instance-profile-dir"
          v-model="profileDir"
          type="text"
          placeholder="auto-generated-from-name"
          class="w-full h-9 px-3 rounded-md bg-background border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          @input="profileDirTouched = true"
        />
        <p class="text-[11px] font-mono text-muted-foreground break-all">
          {{ settingsStore.instancesRootDir }}\{{ profileDirPreview }}
        </p>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="h-8 px-3 text-xs rounded-md bg-secondary text-secondary-foreground font-mono transition-colors hover:bg-accent/60"
          @click="onClose"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="h-8 px-3 text-xs rounded-md bg-primary text-primary-foreground font-mono transition-colors hover:bg-primary/90 disabled:opacity-50"
          :disabled="!name.trim()"
        >
          Create
        </button>
      </div>
    </form>
  </base-dialog>
</template>

<script lang="ts">
import { Component, Prop, VueBase, Watch } from '@i-app/vue-facing-di'
import { inject } from 'tsyringe'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { Slugifier } from '@/domain/support/Slugifier'
import { SettingsStore } from '@/store/modules/settings/SettingsStore'

@Component({
    components: { BaseDialog },
    emits: ['close', 'create'],
})
export default class AddInstanceDialog extends VueBase {
    @Prop({ required: true })
    public readonly open: boolean

    public name = ''
    public profileDir = ''
    public profileDirTouched = false

    constructor(
        @inject(SettingsStore) public readonly settingsStore: SettingsStore,
    ) {
        super()
    }

    @Watch('name')
    onNameChanged(): void {
        if (!this.profileDirTouched) {
            this.profileDir = Slugifier.toKebabCase(this.name)
        }
    }

    get profileDirPreview(): string {
        return Slugifier.toKebabCase(this.profileDir || this.name) || '…'
    }

    public onClose(): void {
        this.reset()
        this.$emit('close')
    }

    public onSubmit(): void {
        const trimmed = this.name.trim()
        if (!trimmed) return
        const profileDir = Slugifier.toKebabCase(this.profileDir || trimmed)
        this.$emit('create', trimmed, profileDir)
        this.reset()
    }

    private reset(): void {
        this.name = ''
        this.profileDir = ''
        this.profileDirTouched = false
    }
}
</script>
