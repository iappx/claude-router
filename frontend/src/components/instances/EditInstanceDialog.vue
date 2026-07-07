<template>
  <base-dialog :open="open" title="Rename instance" @close="onClose">
    <form class="space-y-4" @submit.prevent="onSubmit">
      <div class="space-y-1.5">
        <label class="block text-xs font-mono text-muted-foreground" for="instance-edit-name">Name</label>
        <input
          id="instance-edit-name"
          v-model="name"
          type="text"
          class="w-full h-9 px-3 rounded-md bg-background border border-border text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          autofocus
        />
      </div>

      <div class="space-y-1.5">
        <label class="block text-xs font-mono text-muted-foreground">Profile folder</label>
        <p class="text-sm font-mono text-muted-foreground break-all rounded-md bg-background border border-border px-3 py-2">
          {{ instance?.profileDir }}
        </p>
        <p class="text-[11px] font-mono text-muted-foreground">
          The profile folder can't be changed after creation.
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
          Save
        </button>
      </div>
    </form>
  </base-dialog>
</template>

<script lang="ts">
import { Component, Prop, VueBase, Watch } from '@i-app/vue-facing-di'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { InstanceModel } from '@/domain/models/instance'

@Component({
    components: { BaseDialog },
    emits: ['close', 'save'],
})
export default class EditInstanceDialog extends VueBase {
    @Prop({ required: true })
    public readonly open: boolean

    @Prop({ required: false })
    public readonly instance: InstanceModel | null

    public name = ''

    @Watch('open')
    onOpenChanged(isOpen: boolean): void {
        if (isOpen) {
            this.name = this.instance?.name ?? ''
        }
    }

    public onClose(): void {
        this.$emit('close')
    }

    public onSubmit(): void {
        const trimmed = this.name.trim()
        if (!trimmed || !this.instance) return
        this.$emit('save', this.instance.id, trimmed)
    }
}
</script>
