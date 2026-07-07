<template>
  <dialog-root :open="open" @update:open="(v) => !v && $emit('close')">
    <dialog-portal>
      <dialog-overlay class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <dialog-content
        class="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg border border-border bg-card shadow-2xl p-6 space-y-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        <dialog-title class="font-mono text-base font-semibold text-foreground">{{ title }}</dialog-title>
        <slot />
      </dialog-content>
    </dialog-portal>
  </dialog-root>
</template>

<script lang="ts">
import { Component, Prop, VueBase } from '@i-app/vue-facing-di'

@Component({
    emits: ['close'],
})
export default class BaseDialog extends VueBase {
    @Prop({ required: true })
    public readonly open: boolean

    @Prop({ required: true })
    public readonly title: string
}
</script>
