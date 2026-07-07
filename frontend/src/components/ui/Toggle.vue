<template>
  <button
    type="button"
    :class="cn(
      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none',
      modelValue ? 'bg-primary' : 'bg-muted'
    )"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      :class="cn(
        'pointer-events-none inline-block h-4 w-4 rounded-full bg-card-foreground shadow transition-transform',
        modelValue ? 'translate-x-4' : 'translate-x-0'
      )"
    />
  </button>
</template>

<script lang="ts">
import { Component, Prop, VueBase } from '@i-app/vue-facing-di'
import { cn } from '@/lib/utils'

@Component({
    emits: ['update:modelValue'],
})
export default class Toggle extends VueBase {
    @Prop({ required: true })
    public readonly modelValue: boolean

    public cn = cn
}
</script>
