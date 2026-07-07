<template>
  <div class="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16">
    <bot-icon class="h-8 w-8 text-muted-foreground" />
    <p class="font-mono text-sm text-muted-foreground">No instances yet</p>
    <button
      class="h-8 px-3 text-xs rounded-md bg-primary text-primary-foreground flex items-center gap-1.5 font-mono transition-colors hover:bg-primary/90"
      @click="$emit('create')"
    >
      <plus-icon class="h-3.5 w-3.5" /> New instance
    </button>
  </div>
</template>

<script lang="ts">
import { Component, VueBase } from '@i-app/vue-facing-di'
import { Bot, Plus } from 'lucide-vue-next'

@Component({
    components: { BotIcon: Bot, PlusIcon: Plus },
    emits: ['create'],
})
export default class EmptyState extends VueBase {}
</script>
