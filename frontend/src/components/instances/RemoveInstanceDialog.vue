<template>
  <base-dialog :open="open" title="Remove instance" @close="onClose">
    <p class="text-sm text-muted-foreground font-mono">
      Remove “{{ instance?.name }}”? This cannot be undone.
    </p>

    <label class="flex items-start gap-2 text-xs font-mono text-muted-foreground cursor-pointer">
      <input v-model="deleteFolder" type="checkbox" class="mt-0.5 accent-destructive" />
      Also delete the profile folder
    </label>

    <div v-if="deleteFolder" class="flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
      <alert-triangle-icon class="h-4 w-4 shrink-0 text-destructive mt-0.5" />
      <p class="text-xs font-mono text-destructive">
        “{{ instance?.profileDir }}” and everything inside it will be permanently deleted. This cannot be undone.
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
        type="button"
        class="h-8 px-3 text-xs rounded-md bg-destructive text-destructive-foreground font-mono transition-colors hover:bg-destructive/90"
        @click="onConfirm"
      >
        Remove
      </button>
    </div>
  </base-dialog>
</template>

<script lang="ts">
import { Component, Prop, VueBase, Watch } from '@i-app/vue-facing-di'
import { AlertTriangle } from 'lucide-vue-next'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { InstanceModel } from '@/domain/models/instance'

@Component({
    components: { BaseDialog, AlertTriangleIcon: AlertTriangle },
    emits: ['confirm', 'cancel'],
})
export default class RemoveInstanceDialog extends VueBase {
    @Prop({ required: true })
    public readonly open: boolean

    @Prop({ required: false })
    public readonly instance: InstanceModel | null

    public deleteFolder = false

    @Watch('open')
    onOpenChanged(isOpen: boolean): void {
        if (isOpen) this.deleteFolder = false
    }

    public onClose(): void {
        this.$emit('cancel')
    }

    public onConfirm(): void {
        this.$emit('confirm', this.deleteFolder)
    }
}
</script>
