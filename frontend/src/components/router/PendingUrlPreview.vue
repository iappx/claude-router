<template>
  <div class="rounded-md bg-background border border-border px-3 py-2">
    <p class="text-[11px] font-mono text-muted-foreground">Incoming redirect</p>
    <p class="text-xs font-mono text-foreground break-all mt-0.5">{{ truncated }}</p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, VueBase } from '@i-app/vue-facing-di'

const MAX_LENGTH = 80

@Component({})
export default class PendingUrlPreview extends VueBase {
    @Prop({ required: true })
    public readonly url: string

    get truncated(): string {
        return this.url.length > MAX_LENGTH ? `${this.url.slice(0, MAX_LENGTH - 3)}…` : this.url
    }
}
</script>
