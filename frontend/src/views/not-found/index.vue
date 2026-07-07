<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-foreground">
    <p class="font-mono text-sm text-muted-foreground">404</p>
    <h1 class="font-mono text-xl font-semibold">Page not found</h1>
    <router-link to="/app/dashboard" class="font-mono text-sm text-primary hover:underline">
      Back to instances
    </router-link>
  </div>
</template>

<script lang="ts">
import { Component, VueBase } from '@i-app/vue-facing-di'

@Component({})
export default class NotFoundPage extends VueBase {}
</script>
